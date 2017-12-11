class TaskCtrl {
    constructor(Tasks, PomTimer, $scope, $state) {
        'ngInject';

        this._Tasks = Tasks;   
        this._PomTimer = PomTimer;
        this._$state = $state;              
        this._$scope = $scope;
        /* Question - not sure if this is necessary, can we just use two-way binding with fields Ex: this.task etc.. */        
        // this.formData = {
        //     id: this.task.id,
        //     title: this.task.title,
        //     order: this.task.order,
        //     priority: this.task.priority,
        //     timesPaused: this.task.timesPaused,
        //     isActive: this.task.isActive,
        //     isComplete: this.task.isComplete,
        //     wasSuccessful: this.task.wasSuccessful,
        //     createdAt: this.task.createdAt,
        //     updatedAt: this.task.updatedAt,
        //     tagList: this.task.tagList,
        //     showNotes: this.task.showNotes,
        //     // notes: this.task.notes,
        //     user: this.task.user
        // }
    }

    toggleTaskNotes() {
        this.task.showNotes = !this.task.showNotes;
        this._Tasks.update(this.task);                
                                
        // this._Tasks.update(this.task).then(
        //     (success) => { this.task.showNotes = !this.task.showNotes; },
        //     (err) => console.log(err)
        // );        
    }

    deleteTask() {
        // this.isDeleting = true; // TODO: send this to parent ctrl as component will be deleted? -see article-actions.component
        this._Tasks.delete(this.task).then(
            (success) => { this.handleTaskDeleteSuccess(); },
            (err) => console.log(err)
        )
    }
    handleTaskDeleteSuccess() {
        this._PomTimer.resetTimer();
        this._Tasks.refreshTasks()
    }

    toggleTaskComplete() {
        this.task.isComplete = !this.task.isComplete;
        if (this.task.isActive) { 
            this._PomTimer.resetTimer();
            this.task.isActive = false; 
        };
        this._Tasks.update(this.task).then(
            (success) => this._Tasks.refreshTasks(), 
            (err) => console.log(err)
        )
    }

    toggleTaskActive() {
        this._PomTimer.resetTimer(); // Added here if connection is slow and new PomTimer component isn't instantiated right away (and resetTimer() is called in PomTimer ctor)
        this._Tasks.toggleTaskActive(this.task);
    }
}

let Task =  {
    bindings: {
        task: '='
    },
    controller: TaskCtrl,
    templateUrl: 'components/task-helpers/task.html'
};

export default Task;
