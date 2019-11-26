let fs = require("fs");
let router = require("express").Router();
let Student = require("../models/student");
let Appointment = require("../models/appointment");
let Question = require("../models/question");
let config = require("../config");

let colors = ["success", "info", "warning", "primary", "danger", "dark"];

router.get("/signup", function(req, res) {
  res.render("student/signup", {hideNav: true});
});

router.post("/signup", function(req, res) {
  Student.findOne({matNo: req.body.matNo}, function(err, student) {
    if (err) return console.log(err);
    if (student) {
      req.flash("error_msg", "This username is already taken");
      return res.redirect("/student/signup"); // student already registered
    }
    if (req.body.password == req.body.confirmPassword) {
      let photoName;
      if (req.files && req.files.photo) {
        console.log(req.files);
        photoName = "pp_" + new Date().getTime() + "_" + req.files.photo.name;
        req.files.photo.mv(config.photoPath + photoName, function(err) {
        if(err) console.log(err);
        Student.create({
          matNo: req.body.matNo,
          password: req.body.password,
          email: req.body.email,
          name: {
            surname: req.body.surname,
            otherName: req.body.otherName
          },
          phone: req.body.phone,
          photo: photoName,
          address: req.body.address,
          }, function(err, doc) {
            if (err) return console.log(err);
            console.log("student signup successful");
            req.flash("success_msg", "Signup successful");
            res.redirect("/student/signin");
          });
        });
      }
    } else {
      req.flash("error_msg", "Passwords do not match");
      res.redirect("/student/signup");
    }
  });
});

router.get("/signin", function(req, res) {
  res.render("student/signin", {hideNav: true});
});

router.post("/signin", function(req, res) {
  Student.findOne({matNo: req.body.matNo}, function(err, user) {
    if (err) return console.log(err);
    if(user && user.password == req.body.password) {
      req.session.user = user;
      req.session.home = "/student/home";
      req.session.profile = "/student/profile/";
      req.session.logout = "/student/logout";
      res.redirect("/student/home")
    } else {
      req.flash("error_msg", "Incorrect Login Details")
      res.redirect("/student/signin");
    }
  });
});

router.use(function(req, res, next) {
  console.log("=======called=========");
  if (req.session.user == null) {
    res.redirect("/student/signin");
  } else {
    console.log(req.session.user._id);
    req.session.user = req.session.user;
    req.session.home = "/student/home";
    req.session.profile = "/student/profile/";
    req.session.logout = "/student/logout";
    next();
  }
});

router.get("/profile/:studentId", function(req, res) {
  Student.findById(req.params.studentId, function(err, student) {
    if (err) return console.log(err);
    res.render("student/profile");
  });
});

router.post("/profile/:studentId", function(req, res) {
  Student.findById(req.params.studentId, function(err, student) {
    if (err) return console.log(err);
    let oldPhoto = student.photo;
    let keys = Object.keys(req.body);
    keys.forEach((key) => student[key] = req.body[key]); // update data
    
    let photoName;
    if (req.files && req.files.photo) {
      fs.unlinkSync(config.photoPath + oldPhoto); // delete old image file
      photoName = "pp_" + new Date().getTime() + "_" + req.files.photo.name;
      req.files.photo.mv(config.photoPath + photoName, function(err) {
      if(err) console.log(err);
      student.photo = photoName;
      student.save(function(err, doc) {
          if (err) return console.log(err);
          req.session.user = doc;
          console.log("student profile update successful");
          res.redirect("/student/profile/" + req.params.studentId);
        });
      });
    } else {
      student.save(function(err, doc) {
          if (err) return console.log(err);
          req.session.user = doc;
          console.log("student profile update successful");
          res.redirect("/student/profile/" + req.params.studentId);
        });
    }
  });
});

router.get("/logout", function(req, res) {
  req.session.user = null;
  res.redirect("/student/signin");
});

router.get("/reset_password/:studentId", function(req, res) {
  Student.findById(req.params.studentId)
  .select("_id matNo email")
  .exec(function(err, staff) {
    if (err) return console.log(err);
    res.render("staff/reset-password");
  });
});

router.post("/reset_password/:studentId", function(req, res) {
  if (req.body.matNo == req.session.user.matNo && req.body.email == req.session.user.email) {
    if (req.body.password != req.body.confirmPassword) {
      req.flash("error_msg", "Passwords do not match");
      res.redirect("/student/reset_password");
    }
    Student.findByIdAndUpdate(req.params.studentId, {$set: {password: req.body.password}})
    .exec(function(err, student) {
      if (err) return console.log(err);
      req.session.user = student;
      console.log("Password reset successful");
      req.flash("success_msg", "Password Reset Successfully");
      res.redirect("/student/login/" + req.params.studentId);
    });
  }
});

router.get("/appointment/:studentId", function(req, res) {
  Appointment.find({student: req.params.studentId})
    .populate("staff")
    .exec(function(err, docs) {
      if (err) return console.log(err);
      for (let i = 0, length = docs.length; i < length; i++) {
        docs[i].timeScheduled = docs[i].timeApproved ? new Date(docs[i].timeApproved).toGMTString() : false;
        docs[i].staffName =  docs[i].timeApproved ?  (docs[i].staff.name.surname + " " + docs[i].staff.name.otherName) : "";
        docs[i].color = colors[i % colors.length];
      }
      res.render("student/appointment", {appointments: docs});
    })
})

router.post("/appointment/book/:studentId", function(req, res) {
  Appointment.create({title: req.body.title, student: req.params.studentId}, function(err, doc) {
    if (err) return console.log(err);
    res.redirect("/student/appointment/" + req.params.studentId);
  });
});

router.get("/question/:studentId", function(req, res) {
  Question.find({student: req.params.studentId})
    .populate("staff")
    .exec(function(err, docs) {
      if (err) return console.log(err);
      for (let i = 0, length = docs.length; i < length; i++) {
        docs[i].staffName =  docs[i].isSolved ?  (docs[i].staff.name.surname + " " + docs[i].staff.name.otherName) : "";
        docs[i].color = colors[i % colors.length];
      }
      res.render("student/question", {questions: docs});
    })
})

router.post("/question/:studentId", function(req, res) {
  Question.create({title: req.body.title, student: req.params.studentId},
    function(err, doc) {
      if (err) return console.log(err);
      res.redirect("/student/question/" + req.params.studentId);
    });
});

router.get("/home", function(req, res) {
  res.render("student/home");
});

module.exports = router;