const UsersRepository = require("../UsersRepository");
const UserSchema = require("../../schemas/UserSchema.js");

module.exports = class UserRepository extends UsersRepository {
  constructor(mongoose) {
    super(mongoose, mongoose.model("Users", UserSchema));
  }

  parse(entity) {
    return {
      codigouser: null,
      username: null,
      voiceTime: null,
      totalMessages: null,
      ...(super.parse(entity) || {}),
    };
  }
};
