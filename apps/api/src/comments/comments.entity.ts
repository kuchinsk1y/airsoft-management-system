import { Prisma } from '../generated/prisma-client';

export type CommentWithRelations = Prisma.CommentGetPayload<{
  include: {
    author: {
      select: {
        id: true;
        nickName: true;
        fullName: true;
        logoUrl: true;
      };
    };
    event: {
      select: {
        id: true;
        name: true;
        applicationId: true;
      };
    };
    moderator: {
      select: {
        id: true;
        nickName: true;
        fullName: true;
      };
    };
  };
}>;
