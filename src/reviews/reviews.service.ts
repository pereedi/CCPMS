import { prisma } from '../config/database';

export class ReviewsService {
  async createReview(data: {
    username:         string;
    reviewersUsername: string;
    report_url:       string;
  }) {
    return (prisma as any).review.create({ data: { ...data, status: 'PENDING' } });
  }

  async getReviews(callerUsername: string, callerRole: 'OFEM' | 'AD') {
    return (prisma as any).review.findMany({
      where:   callerRole === 'OFEM' ? {} : { username: callerUsername },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateReviewStatus(id: string, status: 'APPROVED' | 'REJECTED') {
    return (prisma as any).review.update({
      where: { id },
      data:  { status, reviewedAt: new Date() },
    });
  }
}
