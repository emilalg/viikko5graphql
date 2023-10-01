import { GraphQLError } from 'graphql';
import { Cat } from '../../interfaces/Cat';
import { locationInput } from '../../interfaces/Location';
import { UserIdWithToken } from '../../interfaces/User';
import rectangleBounds from '../../utils/rectangleBounds';
import catModel from '../models/catModel';
import { Types } from 'mongoose';

const catResolver = {
    Query: {
        catById: async (_: unknown, cat: Cat) => {
            return await catModel.findById(cat.id);
        },

        cats: async () => {
            return await catModel.find();
        },

        catsByArea: async (_: unknown, location: locationInput) => {
            const bounds = rectangleBounds(location.topRight, location.bottomLeft);
            return await catModel.find({
                location: {
                    $geoWithin: {
                        $geometry: bounds,
                    },
                },
            });
        },

        catsByOwner: async (_: unknown, userWithToken: UserIdWithToken) => {
            return await catModel.find({ owner: userWithToken.id });
        },
    },

    Mutation: {
        createCat: async (_: unknown, cat: Cat, user: UserIdWithToken) => {
            if (!user.token) return null;

            cat.owner = user.id as unknown as Types.ObjectId;
            const newCat = new catModel({
                cat_name: cat.cat_name,
                weight: cat.weight,
                birthdate: cat.birthdate,
                filename: cat.filename,
                location: cat.location,
                owner: cat.owner,
            }) as Cat;

            const createdCat = (await catModel.create(newCat)) as Cat;
            if (!createdCat) {
                throw new GraphQLError('Cat not created');
            }
            return createdCat;
        },

        deleteCat: async (_: unknown, cat: Cat, user: UserIdWithToken) => {
            const catToDelete = (await catModel.findById(cat.id)) as Cat;
            if (!user.token || catToDelete.owner.toString() !== user.id) {
                throw new GraphQLError('Not authorized');
            }

            const deletedCat = (await catModel.findByIdAndDelete(cat.id)) as Cat;
            return deletedCat;
        },

        deleteCatAsAdmin: async (_: unknown, cat: Cat, user: UserIdWithToken) => {
            if (!user.token || user.role !== 'admin') {
                throw new GraphQLError('Not authorized');
            }

            const deletedCat = (await catModel.findByIdAndDelete(cat.id)) as Cat;
            return deletedCat;
        },

        updateCat: async (_: unknown, cat: Cat, user: UserIdWithToken) => {
            const catToUpdate = (await catModel.findById(cat.id)) as Cat;
            if (!user.token || catToUpdate.owner.toString() !== user.id) {
                throw new GraphQLError('Not authorized');
            }

            const updatedCat = (await catModel.findByIdAndUpdate(cat.id, cat, { new: true })) as Cat;
            return updatedCat;
        },

        updateCatAsAdmin: async (_: unknown, cat: Cat, user: UserIdWithToken) => {
            if (!user.token || user.role !== 'admin') {
                throw new GraphQLError('Not authorized');
            }

            const updatedCat = (await catModel.findByIdAndUpdate(cat.id, cat, { new: true })) as Cat;
            return updatedCat;
        },
    },
};

export default catResolver;