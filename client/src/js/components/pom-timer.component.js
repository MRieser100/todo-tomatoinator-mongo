class PomTimerCtrl {
    // TODO: create PomService to make backend calls for updating time spent on tasks? -OR- just put in tasks.service.js
    constructor($scope, $interval, AppConstants) {
        'ngInject';

        this.timerData = { // TODO: could dynamically load this from user settings in tasks route
            'pom': 25, // .1 for testing
            'shortBrk': 5,
            'longBrk': 10
        }

        this._$scope = $scope;
        this._$interval = $interval;        
        this._AppConstants = AppConstants;

        this.timerInterval = undefined;

        this.timeRemaining = 0; // seconds
        //   *Note - just using angular.isDefined(this.timerInterval) to determine if timer currently running        
        // this.timerRunning = false; // TODO: load these values from session || users settings (save every 10 secs?)

        // request permission on page load
        if (Notification.permission !== "granted") Notification.requestPermission();
    }    

    startTimer(timerType) {        
        var isBreak = timerType.indexOf('Brk') !== -1;

        // Guard clauses
        if (angular.isDefined(this.timerInterval) && !isBreak) return; // Return if timer already running and not trying to start a break
        if (isBreak) this.stopTimer();

        var timerDuration;
        var timerData = this.timerData;
        
        if (this.timeRemaining > 0) { // Timer paused prior
            timerDuration = this.timeRemaining
        } else { // Fresh timer
            timerDuration = timerData[timerType] * 60;
            this.timeRemaining = timerDuration;
        }

        var endTime = new Date().getTime() + timerDuration * 1000;


        // SEE $interval => see: https://docs.angularjs.org/api/ng/service/$interval
        this.timerInterval = this._$interval(() => {            

                var currentTimeDelta = Math.round((endTime - new Date().getTime()) / 1000);
                
                this.timeRemaining = currentTimeDelta;
                this.updateBrowserTitle(this.timeRemaining);

                if (currentTimeDelta <= 0) {
                    this._$interval.cancel(this.timerInterval);
                    this.timerInterval = undefined; // cancelling interval in line above doesn't set this.timerInterval to undefined
                    currentTimeDelta = 0;
                    this.buzzer();
                    this.desktopAlert();
                }               
        }, 1000);        
    }

    pauseTimer() {        
        if (angular.isDefined(this.timerInterval)) {
            this._$interval.cancel(this.timerInterval);
            // this.timerRunning = false;
            this.timerInterval = undefined;
        }
    }

    stopTimer() {
        this.pauseTimer();
        this.timeRemaining = 0;
    }

    updateBrowserTitle(seconds) {
        if (seconds > 0) {
            document.title = `${this.secondsToMinSec(seconds)} \u2014 ${this._AppConstants.appName}`;
        } else {
            document.title = `Buzzz! \u2014 ${this._AppConstants.appName}`
        }
    }
    secondsToMinSec(seconds) {
        var min = Math.floor(seconds / 60);
        var secs = seconds - (min * 60);

        return `${('0' + min).slice(-2)}:${('0' + secs).slice(-2)}`;
    }

    // *** Notification Functionality *** //
    /*
    * from: notify.js - by Pratik Desai {desai@pratyk.com}
    * Enables Browser Desktop Notifications + Audio Notifications using <audio> tag
    *
    */
    // function to trigger notifications
    desktopAlert() {
        if (!Notification) {
            alert('Desktop notifications not available in your browser. Try Chrome, Firefox or Safari.');
            return;
        }
        if (Notification.permission !== "granted") 
            Notification.requestPermission();
        else {
            var notification = new Notification('TomatoTimer', {
                icon: 'http://tomato-timer.com/tom.gif',
                body: "Your time is up!!",
            });
            setTimeout(notification.close.bind(notification), 7000);
            notification.onclick = function () {
                window.focus();
            };
        }
    }

    // control audio notifications
    buzzer() {
        // TODO: hardcoded for testing - remove once settings modal is implemented
        // var alertoption = localStorage.getItem("alertoption");
        var alertoption = 'ding';
        // var volumeoption = localStorage.getItem("volumeoption");
        var volumeoption = '0.5';
        
        var soundsPath = 'assets/sounds/';

        var choice = new Array();
        choice[0] = soundsPath + alertoption + '.mp3';
        choice[1] = soundsPath + alertoption + '.ogg';
        choice[2] = soundsPath + alertoption + '.wav';

        // this.playAudio();

        var alarm = new Howl({
            urls: choice,
            volume: volumeoption
        });
        alarm.play();        
    }

    // playAudio() {
    //     var audio = new Audio('ding.mp3');
    //     // audio.load();
    //     audio.play();
    // }

}

let PomTimer = {
    bindings: {
    },
    controller: PomTimerCtrl,
    templateUrl: 'components/pom-timer.html'
};

export default PomTimer;