import type { Request, Response } from 'express';
import { Reply, Comment } from '../models';
import { validateContent } from '../helpers/validateRequest';
import type { AuthRequest } from '../types/auth';

export const replyController = {
  async create(req: Request, res: Response) {
    try {
      const { commentid } = req.params;
      const { content } = req.body;

      // TODO: middleware авторизации добавит req.user
      const userid = (req as AuthRequest).user?.id;

      const commentidNum = Number(commentid);
      if (isNaN(commentidNum) || commentidNum <= 0) {
        return res.status(400).json({
          error: 'commentid должен быть положительным числом',
        });
      }

      if (!userid) {
        return res.status(403).json({ error: 'Требуется авторизация' });
      }

      const validationResult = validateContent(content, 'content', 4000);

      if (!validationResult.isValid) {
        return res.status(400).json({ error: validationResult.errorMessage });
      }

      const parentComment = await Comment.findByPk(Number(commentid));
      if (!parentComment) {
        return res.status(404).json({ error: 'Комментарий не найден' });
      }

      const reply = await Reply.create({
        content,
        userid,
        commentid: Number(commentid),
      });

      return res.status(201).json(reply);
    } catch (error) {
      return res.status(500).json({ error: 'Ошибка создания ответа' });
    }
  },

  async getByComment(req: Request, res: Response) {
    try {
      const { commentid } = req.params;

      // TODO: middleware авторизации добавит req.user
      const userid = (req as AuthRequest).user?.id;

      if (!userid) {
        return res.status(403).json({ error: 'Требуется авторизация' });
      }

      const commentidNum = Number(commentid);
      if (isNaN(commentidNum) || commentidNum <= 0) {
        return res.status(400).json({
          error: 'commentid должен быть положительным числом',
        });
      }

      const replies = await Reply.findAll({
        where: { commentid: Number(commentid) },
        order: [['createdAt', 'ASC']],
        include: ['reactions'],
      });

      return res.json(replies);
    } catch (error) {
      return res.status(500).json({ error: 'Ошибка получения ответов' });
    }
  },
};
