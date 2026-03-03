import type { Request, Response } from 'express';
import { Comment, Reply, Topic } from '../models';
import { validateContent } from '../helpers/validateRequest';
import type { AuthRequest } from '../types/auth';

export const commentController = {
  async create(req: Request, res: Response) {
    try {
      const { topicid } = req.params;
      const { content } = req.body;

      const userid = (req as AuthRequest).user?.id;
      if (!userid) {
        return res.status(401).json({ error: 'Требуется авторизация' });
      }

      const validationResult = validateContent(content, 'content', 4000);

      if (!validationResult.isValid) {
        return res.status(400).json({ error: validationResult.errorMessage });
      }

      const topicidNum = Number(topicid);
      if (isNaN(topicidNum) || topicidNum <= 0) {
        return res
          .status(400)
          .json({ error: 'topicid должен быть положительным числом' });
      }

      // Проверка существования топика (важно!)
      const topicExists = await Topic.findByPk(topicidNum, {
        attributes: ['id'],
      });
      if (!topicExists) {
        return res.status(404).json({ error: 'Топик не найден' });
      }

      const comment = await Comment.create({
        content: content.trim(),
        userid: userid,
        topicid: topicidNum,
      });

      return res.status(201).json(comment);
    } catch (error) {
      console.error('Ошибка создания комментария:', error);
      return res.status(500).json({ error: 'Ошибка создания комментария' });
    }
  },

  async getByTopic(req: Request, res: Response) {
    try {
      const { topicid } = req.params;

      // TODO: middleware авторизации добавит req.user
      const userid = (req as AuthRequest).user?.id;

      const topicidNum = Number(topicid);
      if (isNaN(topicidNum) || topicidNum <= 0) {
        return res.status(400).json({
          error: 'topicid должен быть положительным числом',
        });
      }

      if (!userid) {
        return res.status(401).json({ error: 'Требуется авторизация' });
      }

      const comments = await Comment.findAll({
        where: { topicid: Number(topicid) },
        order: [['createdAt', 'ASC']],
        include: [
          {
            association: Comment.associations.replies,
            include: [
              {
                association: Reply.associations.reactions,
              },
            ],
          },
          {
            association: Comment.associations.reactions,
          },
        ],
      });

      return res.json(comments);
    } catch (error) {
      return res.status(500).json({ error: 'Ошибка получения комментариев' });
    }
  },

  async update(req: Request, res: Response) {
    try {
      const { id, content } = req.params;
      const userid = (req as AuthRequest).user?.id;

      if (!userid) {
        return res.status(401).json({ error: 'Требуется авторизация' });
      }

      const idNum = Number(id);
      if (isNaN(idNum) || idNum <= 0) {
        return res.status(400).json({
          error: 'id должен быть положительным числом',
        });
      }

      const validationResult = validateContent(content, 'content', 4000);

      if (!validationResult.isValid) {
        return res.status(400).json({ error: validationResult.errorMessage });
      }

      const [affectedCount, updatedComments] = await Comment.update(
        { content },
        {
          where: {
            id: Number(id),
            userid: userid,
          },
          returning: true,
        }
      );

      if (affectedCount === 0) {
        const commentExists = await Comment.findByPk(id, {
          attributes: ['id'],
        });
        if (!commentExists) {
          return res.status(404).json({ error: 'Комментарий не найден' });
        }
        return res.status(403).json({ error: 'Нет прав на редактирование' });
      }

      return res.status(200).json(updatedComments[0]);
    } catch (error) {
      console.error('Ошибка обновления комментария:', error);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userid = (req as AuthRequest).user?.id;

      if (!userid) {
        return res.status(401).json({ error: 'Требуется авторизация' });
      }

      const idNum = Number(id);
      if (isNaN(idNum) || idNum <= 0) {
        return res.status(400).json({
          error: 'id должен быть положительным числом',
        });
      }

      const deletedCount = await Comment.destroy({
        where: {
          id: Number(id),
          userid: userid,
        },
      });

      if (deletedCount === 0) {
        const exists = await Comment.findByPk(id, { attributes: ['id'] });
        if (!exists) {
          return res.status(404).json({ error: 'Комментарий не найден' });
        }
        return res.status(403).json({ error: 'Нет прав на удаление' });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Ошибка удаления комментария:', error);
      return res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
  },
};
