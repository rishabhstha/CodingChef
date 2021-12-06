var express = require("express");
var app = express();
var path = require("path");
var hbs = require("hbs");
var mysql = require("mysql");
var bodyParser = require("body-parser");

//defining path for express configuration
const publicDirectoryPath = path.join(__dirname, "../public");
const viewsPath = path.join(__dirname, "../templates/views");
const partialsPath = path.join(__dirname, "../templates/partials");
//sets static directory to serve
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(publicDirectoryPath));

var Auth = null;
var Admin = false;
var global_username = null;
var global_creator_id = null;
var global_check_auth = null;
var count_reload = 0;


app.use(function (req, res, next) {
    res.locals.Auth = Auth;
    res.locals.global_username = global_username;
    res.locals.global_check_auth = global_check_auth;
    next();
})

// const resetCountReload = (req, res, next) => {
//   var condition = req.path.includes('recipe')
//   if (!condition) {
//     count_reload = 0;
//   }
// }

// app.use(resetCountReload)

hbs.registerHelper('counter', function (index){
  return parseInt(index) + 1;
})

//setup handlebars engine and views location
app.set("view engine", "hbs");
app.set("views", viewsPath);
hbs.registerPartials(partialsPath);


const middleware = (req, res, next)=> {
  if ((Auth) || (Admin)) {
    console.log("access given")
    next();
  } 
  else {
    res.redirect("/login")
  }
}


var config = {
  host: "cooking-chef.mysql.database.azure.com",
  user: "nnchawla@cooking-chef",
  password: "sd&d387!",
  database: "cooking_chef",
  port: 3306,
  ssl: true,
};

const conn = new mysql.createConnection(config);

conn.connect(function (err) {
  if (err) {
    console.log("!!! Cannot connect !!! Error:");
    throw err;
  } else {
    console.log("Connection established.");
  }
});

/****************************
 * Get Methods *
 ****************************/
app.get("/", (req, res) => {
  count_reload = 0;
  res.redirect("/recipe");
});

app.get("/addRecipe", middleware, (req, res) => {
  count_reload = 0;
  ingredients_and_measurements = [
    {
      ingredientName: "",
      measurementGroupID: 0,
    },
  ];

  function readIngMea() {
    conn.query(
      "SELECT ingredientName, measurementGroupID FROM ingredient ORDER BY ingredientName ASC",
      function (err, results, fields) {
        if (err) throw err;

        for (i = 0; i < results.length - 1; i++) {
          //console.log('Row: ' + JSON.stringify(results[i]));
          ingredients_and_measurements[i] = {
            ingredientName: results[i].ingredientName,
            measurementGroupID: results[i].measurementGroupID,
          };
        }
        res.render("add-recipe", {
          ingredients_and_measurements: ingredients_and_measurements,
        });
        console.log("Done.");
      }
    );
  }
  readIngMea();
});

app.get("/user", (req, res) => {
  count_reload = 0;
  res.render("user-profile");
});

app.get("/error", (req, res) => {
  count_reload = 0;
  res.render("error");
});

//Read all public recipes
app.get("/recipe", (req, res) => {
  count_reload = 0;
  function readPublicRecipes() {
    conn.query("SELECT* FROM recipe where recipePrivate = ?", 0, function (
      err,
      results,
      fields
    ) {
      if (err) throw err;
      res.render("index", { recipes: results });
      console.log("Selected" + results.length + " row(s).");
      // for (i = 0; i < results.length; i++) {
      //     console.log('Row: ' + JSON.stringify(results[i]));
      //}
      console.log("Done.");
    });
  }
  readPublicRecipes();
});

//Read selected recipe
app.get("/recipe/:id", (req, res) => {
  var recipeID = req.params.id;
  function readSelectedRecipes(recipeID) {
    conn.query("SELECT* FROM recipe where recipeID = ?", recipeID, 
    function (err, recipe_Info, fields) {
      if (err) throw err;
      //console.log(recipe_Info[0]);
      conn.query("SELECT recipeCost, recipeCalories FROM RecipeSpec where recipeID = ?", recipeID,
      function (err, RecipeSpec, fields) {
        if (err) throw err;
        RecipeSpec[0].recipeCost = RecipeSpec[0].recipeCost.toFixed(2);
        //console.log(RecipeSpec[0]);
        conn.query("SELECT ingredientName, quantity, measurementName FROM Ingredient natural join recipeIngredientMeasurements natural join measurement where recipeID = ?", 
        recipeID,
        function (err, recipe_Ingredients, fields) {
          if (err) throw err;
          //console.log(RecipeSpec[0]);
          
          global_creator_id = recipe_Info[0].creatorID;
          if (Auth == global_creator_id) {
            global_check_auth = true;
          }
          else {
            global_check_auth = null;
          }
          
          res.render("show", { recipes: recipe_Info[0], RecipeSpec: RecipeSpec[0], recipe_Ingredients: recipe_Ingredients});

          if(count_reload == 0){
            count_reload = 1
            res.redirect(`/recipe/${recipeID}`)
          }
        })
        
      })
      //console.log("Selected" + result.length + " row(s).");
      //console.log("Done.");
    });
  }
  readSelectedRecipes(recipeID);
});

app.get("/recipe/:id/edit", (req, res)=> {
  count_reload = 0;
  var recipeID = req.params.id;
  function readSelectedRecipes(recipeID) {
    conn.query("SELECT* FROM recipe where recipeID = ?", recipeID, 
    function (err, recipe_Info, fields) {
      if (err) throw err;
      //console.log(recipe_Info[0]);
      conn.query("SELECT recipeCost, recipeCalories FROM RecipeSpec where recipeID = ?", recipeID,
      function (err, RecipeSpec, fields) {
        if (err) throw err;
        RecipeSpec[0].recipeCost = RecipeSpec[0].recipeCost.toFixed(2);
        //console.log(RecipeSpec[0]);
        conn.query("SELECT ingredientName, quantity, measurementName FROM Ingredient natural join recipeIngredientMeasurements natural join measurement where recipeID = ?", 
        recipeID,
        function (err, recipe_Ingredients, fields) {
          if (err) throw err;
          //console.log(RecipeSpec[0]);
          console.log(recipe_Info)
          res.render("edit-recipe", { recipes: recipe_Info[0], RecipeSpec: RecipeSpec[0], recipe_Ingredients: recipe_Ingredients});
        })
      })
    });
  }
  readSelectedRecipes(recipeID);
})

app.get("/login", (req, res) => {
  count_reload = 0;
  res.render("login");
});

app.get("/signup", (req, res) => {
  count_reload = 0;
  res.render("signup");
});

app.get("/logout", (req, res)=> {
  Auth = null;
  Admin = false;
  global_check_auth = null;
  global_creator_id = null;
  global_username = null;
  count_reload = 0;
  res.redirect('/recipe');
})

/****************************
 * Post Methods *
 ****************************/
//search recipes
app.post("/search", (req, res)=> {
  count_reload = 0;
  var term = req.body.term
  term = `%${term}%`
  console.log(term)
    conn.query("SELECT * FROM recipe where recipeName LIKE ?",
    [
      term
    ],
    function (err, results, fields) {
      if (err) throw err;
      res.render("index", { recipes: results });
    })
});

// Create a new recipe if a user is signed in
app.post("/addrecipe", (req, res) => {
  // var ingredients = [];
  // var count = 0;
  // var data = Object.keys(req.body);
  // console.log(data);
  // //finding out how many ingredients there are
  // data.forEach((prop) =>
  //   prop.includes("ingredient") ? (count = count + 1) : count
  // );

  // // getting name, quantity and measurement for each specific ingredients and storing them in ingredients_quantity
  // for (i = 1; i <= count; i++) {
  //   var ingredient = {};
  //   ingredient.id = i;
  //   ingredient.name = req.body[`ingredient${i}`];
  //   ingredient.quantity = req.body[`quantity${i}`];
  //   ingredient.measurement = req.body[`measurement${i}`];
  //   ingredients.push(ingredient)
  // }

  // // getting properties off of req.body
  // var { name, image, description, servingSize, directions, private, prepTime } = req.body;

  // //making a recipe object
  // var recipe = {
  //   name,
  //   image,
  //   description,
  //   servingSize,
  //   directions,
  //   prepTime,
  //   private,
  //   ingredients
  // };

  // //submit the add recipe page form and see on the conole to see the structure of the recipe object
  // console.log(recipe);
  // var recipeCost = 0;
  // var recipeCalories = 0;
  // var ID = 0;
  // var ingredient_id = 1;
  // var name, quantity, measurement, ingredientID, costPerGram, caloriesPerGram, measurementID, weightInGrams;
  // function createRecipe(recipe, callback, errorCallback) {
  //   conn.query(
  //     "INSERT INTO recipe (recipePhotoURL, recipeName, recipePrivate, recipeDirections, servingSize, creatorID, prepTime, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
  //     [
  //       recipe.image,
  //       recipe.name,
  //       recipe.private,
  //       recipe.directions,
  //       recipe.servingSize,
  //       3,
  //       recipe.prepTime,
  //       recipe.description
  //     ],
  //     function (err, results, fields) {
  //       if (err) errorCallback(err);
  //       console.log(JSON.stringify(results));
  //       //console.log("Inserted " + results.affectedRows + " row(s).");
  //       callback();
        
  //     }
  //   );
  // }

  // function getRecipeID(callback, errorCallback) {
  //   conn.query("SELECT MAX(recipeID) AS recipeID FROM recipe",
  //         function (err, recipeID, fields) {
  //           if (err) errorCallback(err);
  //           console.log(recipeID[0].recipeID);
  //           //console.log(ingredients.length);
  //           ID = recipeID[0].recipeID;
  //           while (ingredient_id < count) {
  //             ingredient = ingredients[ingredient_id];
              
  //             //name = ingredient.name;
  //             //quantity = ingredient.quantity;
  //             //measurement = ingredient.measurement;
              
  //             console.log("name: " + ingredient.name);
  //             console.log("quantity: " + ingredient.quantity);
  //             console.log("measurement: " + ingredient.measurement);
              
  //             callback(ingredient_id, ingredient);
  //           }
  //         }
  //       );
  // }

  // function ingredientTable(ingredient_id, ingredient, callback, errorCallback) {
  //   conn.query("SELECT ingredientID, costPerGram, caloriesPerGram FROM ingredient where ingredientName = ?", ingredient.name,
  //   function (err, ingredient_Results, fields) {
  //     if (err) errorCallback(err);
  //     //ingredientID = ingredient_Results[0].ingredientID;
  //     //costPerGram = ingredient_Results[0].costPerGram;
  //     //caloriesPerGram = ingredient_Results[0].caloriesPerGram;
  //     console.log(ingredient_Results)
  //     ingredient_Results = ingredient_Results[0];
  //     console.log("IngredientID: " + ingredientID);
  //     console.log("costPerGram: " + costPerGram);
  //     console.log("caloriesPerGram: " + caloriesPerGram);
  //     //console.log(index);
  //     callback(ingredient_id, ingredient, ingredient_Results);
        
  //   });
  // }

  // function measurementTable(ingredient_id, ingredient, ingredient_Results, callback, errorCallback) {
  //   conn.query("select measurementID, weightInGrams from measurement where measurementName = ?", ingredient.measurement,
  //   function (err, measurement_Results, fields) {
  //     if (err) errorCallback(err);
  //     console.log(measurement_Results[0].measurementID);
  //     //measurementID = measurement_Results[0].measurementID;
  //     //weightInGrams = measurement_Results[0].weightInGrams;
  //     measurement_Results = measurement_Results[0];
  //     callback(ingredient_id, ingredient, ingredient_Results, measurement_Results);
  //   });
  // }

  // function iRMTable(ingredient_id, ingredient, ingredient_Results, measurement_Results, callback, errorCallback) {
  //   conn.query("insert into recipeIngredientMeasurements (recipeID, ingredientID, measurementID, quantity) values (?, ?, ?, ?)",
  //   [
  //     ID,
  //     ingredient_Results.ingredientID,
  //     measurement_Results.measurementID,
  //     ingredient.quantity
  //   ],
  //   function (err, results, fields) {
  //     if (err) errorCallback(err);
  //     //console.log(ingredientName);
  //     callback(ingredient_id, ingredient, ingredient_Results, measurement_Results);
  //   });
  // }
  
  // function recipeSpecTable(ingredient_id, ingredient, ingredient_Results, measurement_Results, errorCallback) {
  //   //console.log("recipe cost: "+ ingredient_Results[0].costPerGram + ", " + measurement_Results[0].weightInGrams + ", " + ingredient.quantity);
  //   recipeCost += ingredient_Results.costPerGram * measurement_Results.weightInGrams * ingredient.quantity;
  //   //console.log("recipe calories: "+ ingredient_Results[0].caloriesPerGram + ", " + measurement_Results[0].weightInGrams + ", " + ingredient.quantity);
  //   recipeCalories += ingredient_Results.caloriesPerGram * measurement_Results.weightInGrams * ingredient.quantity;
  //   ingredient_id++;
  //   if (ingredients.length == 0) {
  //     //console.log("recipe cost: "+ recipeCost);
  //     //console.log("recipe calories: "+ recipeCalories);
  //     conn.query("INSERT INTO RecipeSpec (recipeID, recipeCost, recipeCalories) VALUES (?, ?, ?)",
  //       [
  //         ID,
  //         recipeCost,
  //         recipeCalories
  //       ],
  //       function (err, results, fields) {
  //         if (err) errorCallback(err);
  //         res.redirect("/recipe/");
  //       });
  //   } else console.log("FUCK");
  // }

  // function failcall(error) {
  //   console.log("ERROR in callback pyramid hell "+error.message);
  //   return res.status(500).json({"Error": error.message})
  // }

  // // check if a user is signed in
  // createRecipe(recipe, function () {
  //   getRecipeID( function (ingredient_id, ingredient) {
  //     ingredientTable(ingredient_id, ingredient, function (ingredient_id, ingredient, ingredient_Results) {
  //       measurementTable(ingredient_id, ingredient, ingredient_Results, function (ingredient_id, ingredient, ingredient_Results, measurement_Results) {
  //         iRMTable(ingredient_id, ingredient, ingredient_Results, measurement_Results, function (ingredient_id, ingredient, ingredient_Results, measurement_Results){
  //           recipeSpecTable(ingredient_id, ingredient, ingredient_Results, measurement_Results, failcall);
  //         }, failcall);
  //       }, failcall);
  //     }, failcall);
  //   }, failcall);
  // }, failcall);
  // // res.redirect("/recipe");
});

app.post("/login", (req, res) => {
  count_reload = 0;
  var username = req.body.username;
  var userPassword = req.body.password;
  function CheckUser(username, userPassword) {
    conn.query("SELECT* FROM usr where username = ? limit 1",
      [
        username
      ],
      function (err, results, fields) {
        if (err) {
          throw err;
        } 
        console.log(results[0].userPassword);
        if (results[0].userPassword != userPassword) {
          res.redirect("/error");
        } else {
          Auth = results[0].userID;
          global_username= results[0].username;
          if (results[0].adminStatus == 1){
            Admin=true;
            console.log("welcome admin");
          }
          //console.log("Inserted " + results.affectedRows + " row(s).");
          res.redirect("/recipe");
        }
      });
  }
  console.log(userPassword);
  CheckUser(username, userPassword);
});

//Create User
app.post("/signup", (req, res) => {
  count_reload = 0;
  console.log(req.body);
  function createUser() {
    conn.query(
      "INSERT INTO usr (email, username, userPassword, adminStatus) VALUES (?, ?, ?, ?);",
      [req.body.email, req.body.username, req.body.password, 0],
      function (err, results, fields) {
        if (err) {
          throw err;
        } else {
          console.log("Inserted " + results.affectedRows + " row(s).");
          res.redirect("/recipe");
        }
      }
    );
  }
  createUser();
});

/****************************
 * Patch Methods *
 ****************************/

app.patch("/recipe", function (req, res) {
  // Add your code here
  res.json({ success: "put call succeed!", url: req.url, body: req.body });
});

app.patch("/recipe/*", function (req, res) {
  // Add your code here
  res.json({ success: "put call succeed!", url: req.url, body: req.body });
});

/****************************
 * Delete Methods *
 ****************************/

app.get("/recipe/:id/delete", function (req, res) {
  console.log("here in the delete method")
  // Add your code here
  var recipeID = req.params.id;
  function deleteRecipe() {
    conn.query(
      "delete from recipeIngredientMeasurements where recipeID = ?;",
      [recipeID],
      function (err, results, fields) {
        if (err) {
          console.log('error1')
          throw err;
        } 
          conn.query(
            "delete from recipespec where recipeID = ?;",
            [recipeID],
            function (err, results, fields) {
              if (err) {
                console.log('error2')
                throw err;
              } 
                conn.query(
                  "delete from recipe where recipeID = ?;",
                  [recipeID],
                  function (err, results, fields) {
                    if (err) {
                      console.log('error3')
                      throw err;
                    } 
                      console.log("Inserted " + results.affectedRows + " row(s).");
                      res.redirect("/recipe");
                    
                  }
                );
              
            }
          );
      }
    );
  }
  deleteRecipe();
});

// app.delete("/recipe", function (req, res) {
  
//   // Add your code here
//   res.json({ success: "delete call succeed!", url: req.url });
// });

app.listen(3000, function () {
  console.log("server is running in port 3000");
});
