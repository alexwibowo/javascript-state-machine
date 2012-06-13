//-----------------------------------------------------------------------------

module("special initialization options", {

    setup: function() {
        this.called = [];
        this.onChangeState   = function(event,from,to) { this.called.push('onchange from ' + from + ' to ' + to); };
        this.onBeforeInit    = function()              { this.called.push("onBeforeInit");                        };
        this.onAfterInit     = function()              { this.called.push("onAfterInit");                         };
        this.onBeforeStartup = function()              { this.called.push("onBeforeStartup");                     };
        this.onAfterStartup  = function()              { this.called.push("onAfterStartup");                      };
        this.onBeforePanic   = function()              { this.called.push("onBeforePanic");                       };
        this.onAfterPanic    = function()              { this.called.push("onAfterPanic");                        };
        this.onBeforeCalm    = function()              { this.called.push("onBeforeCalm");                        };
        this.onAfterCalm     = function()              { this.called.push("onAfterCalm");                         };
        this.onEnterNone     = function()              { this.called.push("onEnterNone");                         };
        this.onEnterGreen    = function()              { this.called.push("onEnterGreen");                        };
        this.onEnterRed      = function()              { this.called.push("onEnterRed");                          };
        this.onLeaveNone     = function()              { this.called.push("onLeaveNone");                         };
        this.onLeaveGreen    = function()              { this.called.push("onLeaveGreen");                        };
        this.onLeaveRed      = function()              { this.called.push("onLeaveRed");                          };
    }

});

//-----------------------------------------------------------------------------

test("initial state defaults to 'none'", function() {
    StateMachine.create({
        target: this,
        events: [
            { name: 'panic', from: 'green', to: 'red'   },
            { name: 'calm',  from: 'red',   to: 'green' }
        ]});
    equal(this.current, 'none');
    deepEqual(this.called,  []);
});

//-----------------------------------------------------------------------------

test("initial state can be specified", function() {
    StateMachine.create({
        target: this,
        initial: 'green',
        events: [
            { name: 'panic', from: 'green', to: 'red'   },
            { name: 'calm',  from: 'red',   to: 'green' }
        ]});
    equal(this.current, 'green');
    deepEqual(this.called, ["onBeforeStartup", "onLeaveNone", "onEnterGreen", "onchange from none to green", "onAfterStartup"]);
});

//-----------------------------------------------------------------------------

test("startup event name can be specified", function() {
    StateMachine.create({
        target: this,
        initial: { state: 'green', event: 'init' },
        events: [
            { name: 'panic', from: 'green', to: 'red'   },
            { name: 'calm',  from: 'red',   to: 'green' }
        ]});
    equal(this.current, 'green');
    deepEqual(this.called, ["onBeforeInit", "onLeaveNone", "onEnterGreen", "onchange from none to green", "onAfterInit"]);
});

//-----------------------------------------------------------------------------

test("startup event can be deferred", function() {
    StateMachine.create({
        target: this,
        initial: { state: 'green', event: 'init', defer: true },
        events: [
            { name: 'panic', from: 'green', to: 'red'   },
            { name: 'calm',  from: 'red',   to: 'green' }
        ]});
    equal(this.current, 'none');
    deepEqual(this.called, []);

    this.init();

    equal(this.current, 'green');
    deepEqual(this.called, ["onBeforeInit", "onLeaveNone", "onEnterGreen", "onchange from none to green", "onAfterInit"]);
});

//-----------------------------------------------------------------------------


