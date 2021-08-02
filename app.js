const { format } = require("date-fns");
const express = require("express");
const app = express();
const path = require("path");
const dbPath = path.join(__dirname, "todoApplication.db");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
let db = null;
app.use(express.json());

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

//initializing database

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

initializeDBAndServer();

//api 1
app.get("/todos/", async (request, response) => {
  const { priority, status, category, date, search_q } = request.query;
  const obj = { priority, status, category, date, search_q };
  let queryList = [];
  if (obj.priority !== undefined) {
    const x = obj.priority;
    if (x === "HIGH" || x === "LOW" || x === "MEDIUM") {
      queryList.push(`priority = '${x}'`);
    } else {
      response.status(400);
      response.send("Invalid Todo Status");
    }
  }
  if (obj.status !== undefined) {
    const x = obj.status;
    if (x === "TO DO" || x === "IN PROGRESS" || x === "DONE") {
      queryList.push(`status = '${x}'`);
    } else {
      response.status(400);
      response.send("Invalid Todo Priority");
    }
  }
  if (obj.category !== undefined) {
    const x = obj.category;
    if (x === "WORK" || x === "HOME" || x === "LEARNING") {
      queryList.push(`category = '${x}'`);
    } else {
      response.status(400);
      response.send("Invalid Todo Category");
    }
  }
  if (obj.search_q !== undefined) {
    queryList.push(`todo LIKE '%${obj.search_q}%'`);
  }
  if (obj.date !== undefined) {
    try {
      const x = format(new Date(obj.date), "yyyy-MM-dd");
      console.log(x);
      queryList.push(`due_date = '${x}'`);
    } catch (e) {
      response.status(400);
      response.send("Invalid Due Date");
    }
  }
  queryList = queryList.join(" and ");
  //console.log(queryList);
  const query = `SELECT * FROM todo where ${queryList};`;
  const queryResponse = await db.all(query);
  response.send(
    queryResponse.map((each) => convertDbObjectToResponseObject(each))
  );
});

//api 2
app.get("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const query = `select * from todo where id = ${todoId}`;
  const queryResult = await db.get(query);
  response.send(convertDbObjectToResponseObject(queryResult));
});

//api 3
app.get("/agenda/", async (request, response) => {
  const { date } = request.query;
  const x = format(new Date(date), "yyyy-MM-dd");
  const query = `select * from todo where due_date = '${x}'`;
  console.log(query);
  const queryResult = await db.all(query);
  response.send(
    queryResult.map((each) => convertDbObjectToResponseObject(each))
  );
});

//api4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  const query = `insert into todo(id, todo, priority, status, category, due_date) 
  values(${id}, '${todo}', '${priority}', '${status}', '${category}', ${dueDate});`;
  await db.run(query);
  response.status(200);
  response.send("Todo Successfully Added");
});

//api 5
app.put("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const { todo, priority, status, category, dueDate } = request.body;
  let s = "",
    x = "";
  if (todo !== undefined) {
    s = `todo='${todo}'`;
    x = "Todo";
  }
  if (priority !== undefined) {
    s = `priority='${priority}'`;
    x = "Priority";
  }
  if (status !== undefined) {
    s = `status='${status}'`;
    x = "Status";
  }
  if (category !== undefined) {
    s = `category='${category}'`;
    x = "Category";
  }
  if (dueDate !== undefined) {
    s = `due_date='${dueDate}'`;
    x = "Due Date";
  }
  const query = `update todo set ${s} where id=${todoId};`;
  await db.run(query);
  response.send(`${x} Updated`);
});

//api 6
app.delete("/todos/:todoId", async (request, response) => {
  const { todoId } = request.params;
  const query = `delete from todo where id = ${todoId}`;
  await db.run(query);
  response.send("Todo Deleted");
});

module.exports = app;
