//-----------------------------------------------------------------------------

module("async");

//-----------------------------------------------------------------------------

test("state transitions", function() {

    var fsm = StateMachine.create({
        initial: 'green',
        events: [
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' },
            { name: 'clear', from: 'yellow', to: 'green'  }
        ],
        callbacks: {
            onLeaveGreen:  function() { return StateMachine.ASYNC; },
            onLeaveYellow: function() { return StateMachine.ASYNC; },
            onLeaveRed:    function() { return StateMachine.ASYNC; }
        }
    });

    equals(fsm.current, 'green',  "initial state should be green");
    fsm.warn();       equals(fsm.current, 'green',  "should still be green because we haven't transitioned yet");
    fsm.transition(); equals(fsm.current, 'yellow', "warn event should transition from green to yellow");
    fsm.panic();      equals(fsm.current, 'yellow', "should still be yellow because we haven't transitioned yet");
    fsm.transition(); equals(fsm.current, 'red',    "panic event should transition from yellow to red");
    fsm.calm();       equals(fsm.current, 'red',    "should still be red because we haven't transitioned yet");
    fsm.transition(); equals(fsm.current, 'yellow', "calm event should transition from red to yellow");
    fsm.clear();      equals(fsm.current, 'yellow', "should still be yellow because we haven't transitioned yet");
    fsm.transition(); equals(fsm.current, 'green',  "clear event should transition from yellow to green");

});

//-----------------------------------------------------------------------------

test("state transitions with delays", function() {

    stop(); // doing async stuff - dont run next qunit test until I call start() below

    var fsm = StateMachine.create({
        initial: 'green',
        events: [
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' },
            { name: 'clear', from: 'yellow', to: 'green'  }
        ],
        callbacks: {
            onLeaveGreen:  function() { return StateMachine.ASYNC; },
            onLeaveYellow: function() { return StateMachine.ASYNC; },
            onLeaveRed:    function() { return StateMachine.ASYNC; }
        }
    });

    equals(fsm.current, 'green',  "initial state should be green");
    fsm.warn();               equals(fsm.current, 'green',  "should still be green because we haven't transitioned yet");
    setTimeout(function() {
        fsm.transition();       equals(fsm.current, 'yellow', "warn event should transition from green to yellow");
        fsm.panic();            equals(fsm.current, 'yellow', "should still be yellow because we haven't transitioned yet");
        setTimeout(function() {
            fsm.transition();     equals(fsm.current, 'red',    "panic event should transition from yellow to red");
            fsm.calm();           equals(fsm.current, 'red',    "should still be red because we haven't transitioned yet");
            setTimeout(function() {
                fsm.transition();   equals(fsm.current, 'yellow', "calm event should transition from red to yellow");
                fsm.clear();        equals(fsm.current, 'yellow', "should still be yellow because we haven't transitioned yet");
                setTimeout(function() {
                    fsm.transition(); equals(fsm.current, 'green',  "clear event should transition from yellow to green");
                    start();
                }, 10);
            }, 10);
        }, 10);
    }, 10);

});

//-----------------------------------------------------------------------------

test("state transition fired during onleavestate callback - immediate", function() {

    var fsm = StateMachine.create({
        initial: 'green',
        events: [
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' },
            { name: 'clear', from: 'yellow', to: 'green'  }
        ],
        callbacks: {
            onLeaveGreen:  function() { this.transition(); return StateMachine.ASYNC; },
            onLeaveYellow: function() { this.transition(); return StateMachine.ASYNC; },
            onLeaveRed:    function() { this.transition(); return StateMachine.ASYNC; }
        }
    });

    equals(fsm.current, 'green', "initial state should be green");

    fsm.warn();  equals(fsm.current, 'yellow', "warn  event should transition from green  to yellow");
    fsm.panic(); equals(fsm.current, 'red',    "panic event should transition from yellow to red");
    fsm.calm();  equals(fsm.current, 'yellow', "calm  event should transition from red    to yellow");
    fsm.clear(); equals(fsm.current, 'green',  "clear event should transition from yellow to green");

});

//-----------------------------------------------------------------------------

test("state transition fired during onleavestate callback - with delay", function() {

    stop(); // doing async stuff - dont run next qunit test until I call start() below

    var fsm = StateMachine.create({
        initial: 'green',
        events: [
            { name: 'panic', from: 'green', to: 'red' }
        ],
        callbacks: {
            onLeaveGreen: function() { setTimeout(function() { fsm.transition(); }, 10); return StateMachine.ASYNC; },
            onEnterRed:   function() {
                equals(fsm.current, 'red', "panic event should transition from green to red");
                start();
            }
        }
    });

    equals(fsm.current, 'green', "initial state should be green");
    fsm.panic(); equals(fsm.current, 'green', "should still be green because we haven't transitioned yet");

});

//-----------------------------------------------------------------------------

test("state transition fired during onleavestate callback - but forgot to return ASYNC!", function() {

    var fsm = StateMachine.create({
        initial: 'green',
        events: [
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' },
            { name: 'clear', from: 'yellow', to: 'green'  }
        ],
        callbacks: {
            onLeaveGreen:  function() { this.transition(); /* return StateMachine.ASYNC; */ },
            onLeaveYellow: function() { this.transition(); /* return StateMachine.ASYNC; */ },
            onLeaveRed:    function() { this.transition(); /* return StateMachine.ASYNC; */ }
        }
    });

    equals(fsm.current, 'green', "initial state should be green");

    fsm.warn();  equals(fsm.current, 'yellow', "warn  event should transition from green  to yellow");
    fsm.panic(); equals(fsm.current, 'red',    "panic event should transition from yellow to red");
    fsm.calm();  equals(fsm.current, 'yellow', "calm  event should transition from red    to yellow");
    fsm.clear(); equals(fsm.current, 'green',  "clear event should transition from yellow to green");

});

//-----------------------------------------------------------------------------

test("state transitions sometimes synchronous and sometimes asynchronous", function() {

    var fsm = StateMachine.create({
        initial: 'green',
        events: [
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' },
            { name: 'clear', from: 'yellow', to: 'green'  }
        ]
    });

    // default behavior is synchronous

    equals(fsm.current, 'green',  "initial state should be green");
    fsm.warn();       equals(fsm.current, 'yellow', "warn event should transition from green to yellow");
    fsm.panic();      equals(fsm.current, 'red',    "panic event should transition from yellow to red");
    fsm.calm();       equals(fsm.current, 'yellow', "calm event should transition from red to yellow");
    fsm.clear();      equals(fsm.current, 'green',  "clear event should transition from yellow to green");

    // but add callbacks that return ASYNC and it magically becomes asynchronous

    fsm.onLeaveGreen  = function() { return StateMachine.ASYNC; }
    fsm.onLeaveYellow = function() { return StateMachine.ASYNC; }
    fsm.onLeaveRed    = function() { return StateMachine.ASYNC; }

    equals(fsm.current, 'green',  "initial state should be green");
    fsm.warn();       equals(fsm.current, 'green',  "should still be green because we haven't transitioned yet");
    fsm.transition(); equals(fsm.current, 'yellow', "warn event should transition from green to yellow");
    fsm.panic();      equals(fsm.current, 'yellow', "should still be yellow because we haven't transitioned yet");
    fsm.transition(); equals(fsm.current, 'red',    "panic event should transition from yellow to red");
    fsm.calm();       equals(fsm.current, 'red',    "should still be red because we haven't transitioned yet");
    fsm.transition(); equals(fsm.current, 'yellow', "calm event should transition from red to yellow");
    fsm.clear();      equals(fsm.current, 'yellow', "should still be yellow because we haven't transitioned yet");
    fsm.transition(); equals(fsm.current, 'green',  "clear event should transition from yellow to green");

    // this allows you to make on-the-fly decisions about whether async or not ...

    fsm.onLeaveGreen = function(event, from, to, async) {
        if (async) {
            setTimeout(function() {
                fsm.transition(); equals(fsm.current, 'yellow', "warn event should transition from green to yellow");
                start(); // move on to next test
            }, 10);
            return StateMachine.ASYNC;
        }
    }
    fsm.onLeaveYellow = fsm.onLeaveRed = null;

    fsm.warn(false);  equals(fsm.current, 'yellow', "expected synchronous transition from green to yellow");
    fsm.clear();      equals(fsm.current, 'green',  "clear event should transition from yellow to green");
    fsm.warn(true);   equals(fsm.current, 'green',  "should still be green because we haven't transitioned yet");

    stop(); // doing async stuff - dont run next qunit test until I call start() in callback above

});

//-----------------------------------------------------------------------------


test("state transition fired without completing previous transition", function() {

    var fsm = StateMachine.create({
        initial: 'green',
        events: [
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' },
            { name: 'clear', from: 'yellow', to: 'green'  }
        ],
        callbacks: {
            onLeaveGreen:  function() { return StateMachine.ASYNC; },
            onLeaveYellow: function() { return StateMachine.ASYNC; },
            onLeaveRed:    function() { return StateMachine.ASYNC; }
        }
    });

    equals(fsm.current, 'green',  "initial state should be green");
    fsm.warn();       equals(fsm.current, 'green',  "should still be green because we haven't transitioned yet");
    fsm.transition(); equals(fsm.current, 'yellow', "warn event should transition from green to yellow");
    fsm.panic();      equals(fsm.current, 'yellow', "should still be yellow because we haven't transitioned yet");

    raises(fsm.calm.bind(fsm), /event calm inappropriate because previous transition did not complete/);

});

//-----------------------------------------------------------------------------

test("state transition can be cancelled (github issue #22)", function() {

    var fsm = StateMachine.create({
        initial: 'green',
        events: [
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' },
            { name: 'clear', from: 'yellow', to: 'green'  }
        ],
        callbacks: {
            onLeaveGreen:  function() { return StateMachine.ASYNC; },
            onLeaveYellow: function() { return StateMachine.ASYNC; },
            onLeaveRed:    function() { return StateMachine.ASYNC; }
        }
    });

    equals(fsm.current, 'green',  "initial state should be green");
    fsm.warn();       equals(fsm.current, 'green',  "should still be green because we haven't transitioned yet");
    fsm.transition(); equals(fsm.current, 'yellow', "warn event should transition from green to yellow");
    fsm.panic();      equals(fsm.current, 'yellow', "should still be yellow because we haven't transitioned yet");
    equals(fsm.can('panic'), false, "but cannot panic a 2nd time because a transition is still pending")

    raises(fsm.panic.bind(fsm), /event panic inappropriate because previous transition did not complete/);

    fsm.transition.cancel();

    equals(fsm.current,     'yellow', "should still be yellow because we cancelled the async transition");
    equals(fsm.can('panic'), true,    "can now panic again because we cancelled previous async transition");

    fsm.panic();
    fsm.transition();

    equals(fsm.current, 'red', "should finally be red now that we completed the async transition");

});

//-----------------------------------------------------------------------------

test("callbacks are ordered correctly", function() {

    var called = [];

    var fsm = StateMachine.create({
        initial: 'green',
        events: [
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' },
            { name: 'clear', from: 'yellow', to: 'green'  },
        ],
        callbacks: {
            onChangeState: function(event,from,to) { called.push('onchange from ' + from + ' to ' + to); },

            onEnterGreen:  function() { called.push('onEnterGreen');                             },
            onEnterYellow: function() { called.push('onEnterYellow');                            },
            onEnterRed:    function() { called.push('onEnterRed');                               },
            onLeaveGreen:  function() { called.push('onLeaveGreen');  return StateMachine.ASYNC; },
            onLeaveYellow: function() { called.push('onLeaveYellow'); return StateMachine.ASYNC; },
            onLeaveRed:    function() { called.push('onLeaveRed');    return StateMachine.ASYNC; },

            onBeforeWarn:  function() { called.push('onBeforeWarn');                },
            onBeforePanic: function() { called.push('onBeforePanic');               },
            onBeforeCalm:  function() { called.push('onBeforeCalm');                },
            onBeforeClear: function() { called.push('onBeforeClear');               },
            onAfterWarn:   function() { called.push('onAfterWarn');                 },
            onAfterPanic:  function() { called.push('onAfterPanic');                },
            onAfterCalm:   function() { called.push('onAfterCalm');                 },
            onAfterClear:  function() { called.push('onAfterClear');                }
        }
    });

    called = [];
    fsm.warn();       deepEqual(called, ['onBeforeWarn', 'onLeaveGreen']);
    fsm.transition(); deepEqual(called, ['onBeforeWarn', 'onLeaveGreen', 'onEnterYellow', 'onchange from green to yellow', 'onAfterWarn']);

    called = [];
    fsm.panic();      deepEqual(called, ['onBeforePanic', 'onLeaveYellow']);
    fsm.transition(); deepEqual(called, ['onBeforePanic', 'onLeaveYellow', 'onEnterRed', 'onchange from yellow to red', 'onAfterPanic']);

    called = [];
    fsm.calm();       deepEqual(called, ['onBeforeCalm', 'onLeaveRed']);
    fsm.transition(); deepEqual(called, ['onBeforeCalm', 'onLeaveRed', 'onEnterYellow', 'onchange from red to yellow', 'onAfterCalm']);

    called = [];
    fsm.clear();      deepEqual(called, ['onBeforeClear', 'onLeaveYellow']);
    fsm.transition(); deepEqual(called, ['onBeforeClear', 'onLeaveYellow', 'onEnterGreen', 'onchange from yellow to green', 'onAfterClear']);

});

//-----------------------------------------------------------------------------

test("cannot fire event during existing transition", function() {

    var fsm = StateMachine.create({
        initial: 'green',
        events: [
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' },
            { name: 'clear', from: 'yellow', to: 'green'  }
        ],
        callbacks: {
            onLeaveGreen:  function() { return StateMachine.ASYNC; },
            onLeaveYellow: function() { return StateMachine.ASYNC; },
            onLeaveRed:    function() { return StateMachine.ASYNC; }
        }
    });

    equals(fsm.current,     'green',  "initial state should be green");
    equals(fsm.can('warn'),  true,    "should be able to warn");
    equals(fsm.can('panic'), false,   "should NOT be able to panic");
    equals(fsm.can('calm'),  false,   "should NOT be able to calm");
    equals(fsm.can('clear'), false,   "should NOT be able to clear");

    fsm.warn();

    equals(fsm.current,     'green',  "should still be green because we haven't transitioned yet");
    equals(fsm.can('warn'),  false,   "should NOT be able to warn  - during transition");
    equals(fsm.can('panic'), false,   "should NOT be able to panic - during transition");
    equals(fsm.can('calm'),  false,   "should NOT be able to calm  - during transition");
    equals(fsm.can('clear'), false,   "should NOT be able to clear - during transition");

    fsm.transition();

    equals(fsm.current,     'yellow', "warn event should transition from green to yellow");
    equals(fsm.can('warn'),  false,   "should NOT be able to warn");
    equals(fsm.can('panic'), true,    "should be able to panic");
    equals(fsm.can('calm'),  false,   "should NOT be able to calm");
    equals(fsm.can('clear'), true,    "should be able to clear");

    fsm.panic();

    equals(fsm.current,     'yellow', "should still be yellow because we haven't transitioned yet");
    equals(fsm.can('warn'),  false,   "should NOT be able to warn  - during transition");
    equals(fsm.can('panic'), false,   "should NOT be able to panic - during transition");
    equals(fsm.can('calm'),  false,   "should NOT be able to calm  - during transition");
    equals(fsm.can('clear'), false,   "should NOT be able to clear - during transition");

    fsm.transition();

    equals(fsm.current,     'red',    "panic event should transition from yellow to red");
    equals(fsm.can('warn'),  false,   "should NOT be able to warn");
    equals(fsm.can('panic'), false,   "should NOT be able to panic");
    equals(fsm.can('calm'),  true,    "should be able to calm");
    equals(fsm.can('clear'), false,   "should NOT be able to clear");

});

//-----------------------------------------------------------------------------


