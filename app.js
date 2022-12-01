const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "userData.db");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

app.post("/register", async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const selectUserQuery = `
  SELECT *
  FROM user
  WHERE 
  username = "${username}";`;
  const hashedPassword = await bcrypt.hash(password, 10);
  const dbUser = await db.get(selectUserQuery);
  if (dbUser !== undefined) {
    response.status(400);
    response.send("User already exists");
  } else {
    if (password.length() < 5) {
      response.send("Password is too short");
    }
    const creatUserQuery = `
       INSERT INTO
       user (username, name, password, gender, location )
       VALUES 
       ('${username}', '${name}', '${hashedPassword}', '${gender}', '${location}');`;
    await db.run(creatUserQuery);
    response.send("User created successfully");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `
  SELECT *
  FROM user
  WHERE 
  username = "${username}";`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.send("Login success!");
    } else {
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUserQuery = `
  SELECT *
  FROM user
  WHERE 
  username = "${username}";`;
  const dbUser = await db.get(selectUserQuery);

  if (dbUser !== undefined) {
    const isPasswordMatched = await bcrypt.compare(
      oldPassword,
      dbUser.password
    );

    if (isPasswordMatched === true) {
      if (newPassword.length() < 5) {
        response.status(400);
        response.send("Password is too short");
      }
      const { username, oldPassword, newPassword } = request.body;
      const newHashedPassword = await bcrypt.hash(request.body.newPassword, 10);
      const updateUserQuery = `
        UPDATE
        user
        SET
        username = '${username}',
        Password = '${oldPassword},
        new_password = '${newHashedPassword}';`;
      await db.run(updateUserQuery);
      response.send("Password updated");
    } else {
      response.send("Invalid current password");
    }
  }
});
module.exports = app;
