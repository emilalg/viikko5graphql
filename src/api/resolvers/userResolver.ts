import { GraphQLError } from 'graphql';
import { Cat } from '../../interfaces/Cat';
import LoginMessageResponse from '../../interfaces/LoginMessageResponse';
import { User, UserIdWithToken } from '../../interfaces/User';
import dotenv from 'dotenv';
const fetch = require('node-fetch');
dotenv.config();

const userResolver = {
    Cat: {
        owner: async (cat: Cat) => {
            const response = await fetch(`${process.env.AUTH_URL}/users/${cat.owner}`);
            if (!response.ok) {
                throw new GraphQLError('Not authorized');
            }
            const owner = (await response.json()) as User;
            return owner;
        },
    },

    Query: {
        checkToken: async (_: unknown, __: unknown, userWithToken: UserIdWithToken) => {
            const response = await fetch(`${process.env.AUTH_URL}/users/token`, {
                headers: {
                    Authorization: `Bearer ${userWithToken.token}`,
                },
            });

            if (!response.ok) {
                throw new GraphQLError(response.statusText);
            }
            const user = (await response.json()) as User;
            return user;
        },

        userById: async (_: unknown, user: { id: string }) => {
            const response = await fetch(`${process.env.AUTH_URL}/users/${user.id}`);
            if (!response.ok) {
                throw new GraphQLError(response.statusText);
            }
            const foundUser = (await response.json()) as User;
            return foundUser;
        },

        users: async () => {
            const response = await fetch(`${process.env.AUTH_URL}/users`);
            if (!response.ok) {
                throw new GraphQLError('Not authorized');
            }
            const users = (await response.json()) as User[];
            return users;
        },
    },

    Mutation: {
        deleteUser: async (_: unknown, __: unknown, userWithToken: UserIdWithToken) => {
            const response = await fetch(`${process.env.AUTH_URL}/users`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${userWithToken.token}`,
                },
            });

            if (!response.ok) {
                throw new GraphQLError(response.statusText);
            }
            const deletedUser = (await response.json()) as User;
            return deletedUser;
        },

        deleteUserAsAdmin: async (
            _: unknown,
            user: User,
            userWithToken: UserIdWithToken
        ) => {
            if (!userWithToken.token || !userWithToken.role.includes('admin')) {
                return null;
            }

            const response = await fetch(`${process.env.AUTH_URL}/users/${user.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userWithToken.token}`,
                    role: userWithToken.role,
                },
            });

            if (!response.ok) {
                throw new GraphQLError(response.statusText);
            }
            const deletedUser = (await response.json()) as User;
            return deletedUser;
        },

        login: async (
            _: unknown,
            credentials: { credentials: { username: string; password: string } }
        ) => {
            const response = await fetch(`${process.env.AUTH_URL}/auth/login`, {
                method: 'POST',
                body: JSON.stringify(credentials.credentials),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new GraphQLError(response.statusText);
            }
            const loginResponse = (await response.json()) as LoginMessageResponse;
            return loginResponse;
        },

        register: async (_: unknown, userDetails: { user: User }) => {
            const response = await fetch(`${process.env.AUTH_URL}/users`, {
                method: 'POST',
                body: JSON.stringify(userDetails.user),
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new GraphQLError(response.statusText);
            }
            const registerResponse = (await response.json()) as LoginMessageResponse;
            return registerResponse;
        },

        updateUser: async (
            _: unknown,
            userDetails: { user: User },
            userWithToken: UserIdWithToken
        ) => {
            if (!userWithToken.token) return null;

            const response = await fetch(`${process.env.AUTH_URL}/users`, {
                method: 'PUT',
                body: JSON.stringify(userDetails.user),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userWithToken.token}`,
                },
            });

            if (!response.ok) {
                throw new GraphQLError(response.statusText);
            }
            const updatedUser = (await response.json()) as LoginMessageResponse;
            return updatedUser;
        },

        updateUserAsAdmin: async (
            _: unknown,
            user: User,
            userWithToken: UserIdWithToken
        ) => {
            if (!userWithToken.token || !userWithToken.role.includes('admin')) {
                return null;
            }

            const response = await fetch(`${process.env.AUTH_URL}/users/${user.id}`, {
                method: 'PUT',
                body: JSON.stringify(user),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${userWithToken.token}`,
                    role: userWithToken.role,
                },
            });

            if (!response.ok) {
                throw new GraphQLError(response.statusText);
            }
            const updatedUser = (await response.json()) as User;
            return updatedUser;
        },
    },
};

export default userResolver;