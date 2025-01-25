

const jwt = require("jsonwebtoken");

async function genToken(payload){
  return await jwt.sign(payload,process.env.JWT_SECRET,{expiresIn:process.env.JWT_EXPIRY}  );
}

module.exports = genToken;