import { Topic } from './topic';
import { Comment } from './comment';
import { Reply } from './reply';
import { Reaction } from './reaction';
import { Op } from 'sequelize';

// Topic - Comment
Topic.hasMany(Comment, {
  foreignKey: 'topicid',
  as: 'comments',
  onDelete: 'CASCADE',
});
Comment.belongsTo(Topic, { foreignKey: 'topicid', as: 'topic' });

// Comment - Reply
Comment.hasMany(Reply, {
  foreignKey: 'commentid',
  as: 'replies',
  onDelete: 'CASCADE',
});
Reply.belongsTo(Comment, { foreignKey: 'commentid', as: 'comment' });

// Реакции
Comment.hasMany(Reaction, {
  foreignKey: 'commentid',
  as: 'reactions',
  constraints: false,
  scope: { commentid: { [Op.ne]: null } },
});
Reply.hasMany(Reaction, {
  foreignKey: 'replyid',
  as: 'reactions',
  constraints: false,
  scope: { replyid: { [Op.ne]: null } },
});

Reaction.belongsTo(Comment, {
  foreignKey: 'commentid',
  as: 'comment',
  constraints: false,
});
Reaction.belongsTo(Reply, {
  foreignKey: 'replyid',
  as: 'reply',
  constraints: false,
});

export { Topic } from './topic';
export { Comment } from './comment';
export { Reply } from './reply';
export { Reaction } from './reaction';
export { UserPreference } from './userPreference';
