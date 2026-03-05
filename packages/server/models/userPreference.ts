import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../db';
import { THEME_VALUES, THEMES, type Theme } from '../types/theme';

interface UserPreferenceAttributes {
  id: number;
  userid: number;
  theme: Theme;
  createdAt?: Date;
  updatedAt?: Date;
}

type UserPreferenceCreationAttributes = Optional<
  UserPreferenceAttributes,
  'id' | 'createdAt' | 'updatedAt'
>;

class UserPreference
  extends Model<UserPreferenceAttributes, UserPreferenceCreationAttributes>
  implements UserPreferenceAttributes
{
  declare id: number;
  declare userid: number;
  declare theme: Theme;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

UserPreference.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userid: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    theme: {
      type: DataTypes.ENUM(...THEME_VALUES),
      allowNull: false,
      defaultValue: THEMES.light,
    },
  },
  {
    sequelize,
    modelName: 'UserPreference',
    tableName: 'user_preferences',
    indexes: [{ unique: true, fields: ['userid'] }],
  }
);

export { UserPreference };
