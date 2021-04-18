const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const cors = require("cors");

const words = require("./models/words");
const User = require("./models/user");
const Comment = require("./models/comment");
const Words = require("./models/words");
const Reply = require("./models/reply");
require("dotenv").config();
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() =>
    app.listen(process.env.PORT || 5000, () => {
      console.log("server is started and data base is connected");
    })
  )
  .catch((err) => console.log(err));

app.use(cors());
app.post("/", (req, res) => {
  words.find().exec((err, data) => {
    if (data) {
      res.json(data);
    } else {
      res.send("not found");
    }
  });
});

app.post("/all", (req, res) => {
  words.find().exec((err, data) => {
    if (data) {
      res.json(data);
    } else {
      res.json("not found");
    }
  });
});

app.post("/new", (req, res) => {
  if (req.session.user_id) {
    res.render("add-page");
  } else {
    res.redirect("/admin/login");
  }
});
app.post("/new", async (req, res) => {
  console.log(req.body);

  const { title, details, ref, rel } = req.body;
  const word = new words({
    title,
    details,
    ref: ref,
    rel: rel,
  });
  await word.save();
  res.redirect(`details/${word.id}`);
});

app.get("/login", (req, res) => {
  if (!req.session.user_id) {
    res.render("login");
  } else {
    res.redirect("/admin");
  }
});
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  var emailAuthenticationModel = {
    email: email,
    password: password,
  };
});

app.get("/admin", (req, res) => {
  if (req.session.user_id) {
    words
      .find({})
      .sort("-createdAt")
      .exec((err, data) => {
        if (data) {
          res.render("admin", { result: data });
          // res.json(data)
        } else {
          res.json("no data");
        }
      });
  } else {
    res.redirect(
      "/login                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     "
    );
  }
});

app.get("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/");
});

app.post("/comment/:id", async (req, res) => {
  const id = req.params.id;
  const words = await Words.findById(id);
  const comment = new Comment(req.body);
  words.comments.push(comment);
  await comment.save();
  await words.save();
  Words.findById({ _id: id })
    .populate({
      path: "comments", 
      populate: {
        path: "replys", 
      },
    })
    .then((data) => {
      res.json(data);
    });
});

app.post("/reply/:cid", async (req, res) => {
  const id = req.params.cid;
  const comment = await Comment.findById(id);

  const reply = new Reply(req.body);
  comment.replys.push(reply);
  await reply.save();
  await comment.save();

  res.json("done");
});
app.post("/dislike/:id", async (req, res) => {
  await words.updateOne(
    { _id: req.params.id },
    { $inc: { "likes.disLike": 1 } }
  );
  res.json("done");
});
app.post("/likes/:id", async (req, res) => {
  await words.updateOne(
    { _id: req.params.id },
    { $inc: { "likes.likeCount": 1 } }
  );
  res.send("done");
});

app.get("/:letter", (req, res) => {
  let letter = req.params.letter;
  words
    .find({ title: { $regex: "^" + letter, $options: "i" } })
    .exec((err, data) => {
      if (data) {
        res.json(data);
      } else {
        res.send("not found");
      }
    });
});

app.get("/details/:id", (req, res) => {
  let id = req.params.id;
  words
    .findOne({ _id: id })
    .populate({
      path: "comments",
      populate: {
        path: "replys",
      },
    })
    .then((data) => {
      res.json(data);
    });
});

app.get("/delete/:id", (req, res) => {
  var id = req.params.id;
  console.log("here", id);
  words.deleteOne(
    {
      _id: id,
    },
    function (err) {
      if (err) {
        //console.log(err)
      } else {
        // res.redirect("/admin")
      }
    }
  );
});

app.get("/edit/:id", function (req, res) {
  words.findById(req.params.id, function (err, data) {
    if (err) {
      console.log(err);
    } else {
      res.json(data);
    }
  });
});

app.post("/edit/:id", function (req, res) {
  var refs = [];

  var i = 1;
  while (true) {
    var link = req.body["ref_link" + i];
    var name = req.body["ref_name" + i];
    if (link && name) {
      i++;
      refs.push({ name: name, link: link });
    } else {
      break;
    }
  }

  var rels = [];

  var j = 1;
  while (true) {
    var link = req.body["rel_link" + j];
    var name = req.body["rel_name" + j];
    if (link && name) {
      j++;
      rels.push({ name: name, link: link });
    } else {
      break;
    }
  }
  const { title, details } = req.body;
  const word = {
    title,
    details,
    ref: refs,
    rel: rels,
  };
  console.log(word);

  words.findByIdAndUpdate(req.params.id, { $set: word }, function (err) {
    if (err) {
      res.json("err");
    } else {
      res.json("done");
    }
  });
});
