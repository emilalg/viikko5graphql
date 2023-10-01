/* eslint-disable node/no-extraneous-import */
require('dotenv').config();
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import {ApolloServer} from '@apollo/server';
import {expressMiddleware} from '@apollo/server/express4';
import typeDefs from './api/schemas/index';
import resolvers from './api/resolvers/index';
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from '@apollo/server/plugin/landingPage/default';
import {notFound, errorHandler} from './middlewares';
import authenticate from './functions/authenticate';
import {MyContext} from './interfaces/MyContext';
import {createRateLimitRule} from 'graphql-rate-limit';
import {shield} from 'graphql-shield';
import {makeExecutableSchema} from '@graphql-tools/schema';
import {applyMiddleware} from 'graphql-middleware';

const app = express();

app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);
app.use(cors<cors.CorsRequest>());
app.use(express.json());

(async () => {
  try {
    // Creating a rate limit rule instance
    const rateLimitRule = createRateLimitRule({ identifyContext: (ctx) => ctx.id });

    // Creating a permissions object
    const permissions = shield({
      Query: {
          catById: rateLimitRule({ window: '1s', max: 5 }),
          cats: rateLimitRule({ window: '1s', max: 5 }),
          catsByArea: rateLimitRule({ window: '1s', max: 5 }),
          catsByOwner: rateLimitRule({ window: '1s', max: 5 }),
          users: rateLimitRule({ window: '1s', max: 5 }),
          userById: rateLimitRule({ window: '1s', max: 5 }),
          checkToken: rateLimitRule({ window: '1s', max: 5 }),
      },
      Mutation: {
          createCat: rateLimitRule({ window: '1s', max: 5 }),
          updateCat: rateLimitRule({ window: '1s', max: 5 }),
          deleteCat: rateLimitRule({ window: '1s', max: 5 }),
          updateCatAsAdmin: rateLimitRule({ window: '1s', max: 5 }),
          deleteCatAsAdmin: rateLimitRule({ window: '1s', max: 5 }),
          login: rateLimitRule({ window: '1s', max: 5 }),
          register: rateLimitRule({ window: '1s', max: 5 }),
          updateUser: rateLimitRule({ window: '1s', max: 5 }),
          deleteUser: rateLimitRule({ window: '1s', max: 5 }),
          updateUserAsAdmin: rateLimitRule({ window: '1s', max: 5 }),
          deleteUserAsAdmin: rateLimitRule({ window: '1s', max: 5 }),
      },
      // ... other configurations
  });

    // Applying the permissions object to the schema
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    });

    const schemaWithMiddleware = applyMiddleware(
      schema,
      permissions
    );

    const server = new ApolloServer<MyContext>({
      schema: schemaWithMiddleware,  // Updated this line
      introspection: true,
      plugins: [
        process.env.NODE_ENV === 'production'
          ? ApolloServerPluginLandingPageProductionDefault({
              embed: true as false,
            })
          : ApolloServerPluginLandingPageLocalDefault(),
      ],
      includeStacktraceInErrorResponses: false,
    });
    await server.start();

    app.use(
      '/graphql',
      expressMiddleware(server, {
        context: async ({req}) => authenticate(req),
      })
    );

    app.use(notFound);
    app.use(errorHandler);
  } catch (error) {
    console.log(error);
  }
})();

export default app;