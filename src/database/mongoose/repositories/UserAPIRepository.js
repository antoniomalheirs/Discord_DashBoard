const UsersRepository = require("../UsersRepository.js");
const UserAPISchema = require("../../schemas/UserAPISchema.js");

module.exports = class UserRepository extends UsersRepository {
  constructor(mongoose) {
    super(mongoose, mongoose.model("APIUsers", UserAPISchema));
  }

  parse(entity) {
    return {
      codigouser: null,
      username: null,
      ...(super.parse(entity) || {}),
    };
  }
};
