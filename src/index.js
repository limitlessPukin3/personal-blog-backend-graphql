const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const typeDefs = gql`
  type User {
    id: Int!
    name: String!
    email: String!
    posts: [Post!]!
  }

  type Post {
    id: Int!
    title: String!
    content: String!
    published: Boolean!
    author: User!
    comments: [Comment!]!
  }

  type Comment {
    id: Int!
    content: String!
    post: Post!
  }

  type Query {
    users: [User!]!
    posts: [Post!]!
    comments: [Comment!]!
    post(id: Int!): Post
  }

  type Mutation {
    createUser(name: String!, email: String!): User!
    createPost(title: String!, content: String!, authorId: Int!): Post!
    createComment(content: String!, postId: Int!): Comment!
  }
`;

const resolvers = {
  Query: {
    users: () => prisma.user.findMany(),
    posts: () => prisma.post.findMany(),
    comments: () => prisma.comment.findMany(),
    post: (_, { id }) => prisma.post.findUnique({ where: { id } }),
  },
  Mutation: {
    createUser: (_, { name, email }) => prisma.user.create({ data: { name, email } }),
    createPost: (_, { title, content, authorId }) => prisma.post.create({ data: { title, content, authorId } }),
    createComment: (_, { content, postId }) => prisma.comment.create({ data: { content, postId } }),
  },
  User: {
    posts: (parent) => prisma.post.findMany({ where: { authorId: parent.id } }),
  },
  Post: {
    author: (parent) => prisma.user.findUnique({ where: { id: parent.authorId } }),
    comments: (parent) => prisma.comment.findMany({ where: { postId: parent.id } }),
  },
  Comment: {
    post: (parent) => prisma.post.findUnique({ where: { id: parent.postId } }),
  },
};

async function startServer() {
  const app = express();
  const server = new ApolloServer({ typeDefs, resolvers });

  await server.start();
  server.applyMiddleware({ app });

  app.listen({ port: 4000 }, () =>
    console.log(`🚀 Server ready at http://localhost:4000${server.graphqlPath}`)
  );
}

startServer();
