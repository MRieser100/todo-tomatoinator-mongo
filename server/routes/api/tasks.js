var router = require('express').Router();
var passport = require('passport');
var mongoose = require('mongoose');
var async = require('async')

var User = mongoose.model('User');
var Task = mongoose.model('Task');
var Note = mongoose.model('Note');
var auth = require('../auth');
// var Tag = mongoose.model('Tag'); // @wip

/* INTERCEPT and prepopulate user data */
router.param('tasks', function(req, res, next) {
    // Article.findOne({ slug: slug })
    //     .populate('author')
    //     .then(function (article) {
    //         if (!article) { return res.sendStatus(404); }
    //         req.article = article;
    //         return next();
    //     }).catch(next);
});

/* POST create task */
// TODO: Once user auth functionality in place, implement saving tasks based off of user
//  SEE: file:///C:/Projects/Angular_Workspace/1/Thinkster_Full_Stack/Backend_Node/07_creating_crud_endpoints_for_articles.htm - Utilizing router parameters
router.post('/', auth.required, function(req, res, next) {
  User.findById(req.payload.id).then(function(user){
    if (!user) { return res.sendStatus(401); }

    var task = new Task(req.body.task);

    task.user = user;

    return task.save().then(function(){
        console.log(task.user);
        // return res.json({task: task.toJSON});
        return res.json({task: task.toJSONFor(user)});
    });
  }).catch(next);
});



/* GET task list */
router.get('/', auth.optional, function(req, res, next) {
  var query = {};
  var limit = 20;
  var offset = 0;
  
  User.findById(req.payload.id).then(function(user){
    /* Kept for reference - see: file:///C:/Projects/Angular_Workspace/1/Thinkster_Full_Stack/Backend_Node/12_creating_queryable_endpoints_for_lists_and_feeds.htm - 'Create an endpoint to list articles'
    if(typeof req.query.limit !== 'undefined'){
      limit = req.query.limit;
    }

    if(typeof req.query.offset !== 'undefined'){
      offset = req.query.offset;
    }
    */
    if (typeof req.query.tag !== 'undefined') {
      query.tagList = {"$in": [req.query.tag]};
    }

    var userId = user._id;
    query.user = userId;

    return Promise.all([
      // *tasks*
      Task.find(query)
        .populate('user')
        .populate('notes')
        // .limit(Number(limit))
        // .skip(Number(offset))
        .sort({order: 'asc'})        
        .exec(),
      // *tasksCount*
      Task.count(query).exec()
      // *user*
      // req.payload ? User.findById(req.payload.id) : null, // not needed since we already know user
    ]).then(function(results){
      var tasks = results[0];
      var tasksCount = results[1];    
      var tasksLength = tasks.length
      var highestOrderNumber = results[0][tasksLength-1].order                   

      return res.json({
        tasks: tasks.map(function(task){          
          // task.populate({path: 'notes'}).execPopulate().then((t) => console.log(t));
          // console.log(`task: ${task}`);
          return task.toJSONFor(user);           
        }),
        tasksCount: tasksCount,
        highestOrderNumber: highestOrderNumber
      });
    }).catch(next);
  })
});

/* PUT update task */ 
router.put('/update', auth.required, function(req, res, next) {      
    User.findById(req.payload.id).then(function(user){
      if(req.body.task.user.id.toString() === req.payload.id.toString()){       

          Task.findById(req.body.task.id).populate('user').then(function(targetTask) {                      

            if(typeof req.body.task.title !== 'undefined'){
                targetTask.title = req.body.task.title;
            }
            
            if(typeof req.body.task.order !== 'undefined'){
                targetTask.order = req.body.task.order;
            }

            if(typeof req.body.task.priority !== 'undefined') {
              targetTask.priority = req.body.task.priority;
            }
            
            // TODO: not sure if this should go here?
            // if(typeof req.body.task.timesPaused !== 'undefined'){
            //     targetTask.timesPaused = req.body.task.timesPaused;
            // }

            if(typeof req.body.task.timesPaused !== 'undefined'){
                targetTask.timesPaused = req.body.task.timesPaused;
            }

            if(typeof req.body.task.isActive !== 'undefined'){
                targetTask.isActive = req.body.task.isActive;
            }

            if(typeof req.body.task.isComplete !== 'undefined'){
                targetTask.isComplete = req.body.task.isComplete;
            }          
            
            if(typeof req.body.task.wasSuccessful !== 'undefined'){
                targetTask.wasSuccessful = req.body.task.wasSuccessful;
            } 

            if(typeof req.body.task.showNotes !== 'undefined'){
                targetTask.showNotes = req.body.task.showNotes;
            }   

            /* Note: placeholders for (potential) future fields */
            // if(typeof req.body.task.isComplete !== 'undefined'){
            //     targetTask.isComplete = req.body.task.isComplete;
            // }                       

            return targetTask.save().then(function(task){
                return res.json({task: targetTask.toJSONFor(user)});
            }).catch(next)                  
          });

    
       }
    });
});

/* INTERCEPT and prepopulate task data from id */
// TODO: REFACTOR other routes to utilize this interceptor //
router.param('taskId', function(req, res, next, id) {
    console.log('PARAM');
    console.log(`id: ${id}`);
    Task.findById(id)
      .populate('user')
      // .populate('notes')
      .then(function (task) {            
            if (!task) { return res.sendStatus(404); }
            req.task = task;
            return next();
        }).catch(next);
});

/* DELETE task */
router.delete('/:taskId', auth.required, function(req, res, next) {
  User.findById(req.task.id).then(function(user){
      if(req.task.user.id.toString() === req.payload.id.toString()){       
          Task.findById(req.task.id).remove().then(function(targetTask) {     
            return res.sendStatus(204);
          });
      } else {
        return res.sendStatus(403);
      }
  });
});

// ------- NOTE routes -------
router.post('/notes', auth.required, function(req, res, next) {
  User.findById(req.body.task.user.id).then(function(user) {
    // if (!user) { return res.sendStatus(401); } // Note: user was NOT authenticated in articles.js POST create comment on article, this was there instead (??)
    if(req.body.task.user.id.toString() === req.payload.id.toString()) {            
      Task.findById(req.body.task.id).then(function(task) {
        var note = new Note(req.body.note);
        note.task = req.body.task.id;
        // TODO/QUESTION: Set Note's user?        
                    
        return note.save().then(function(note) {
          task.notes.push(note);

          return task.save().then(function() {
            return res.json({note: note.toJSON()})
          });
        });
    });            
      
    }
  }).catch(next);
});

module.exports = router;