//-----------------------------------------------------------------------------

module("basic");

//-----------------------------------------------------------------------------

test("standalone state machine", function() {

    var fsm = StateMachine.create({
        initial: 'green',
        events: [
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' },
            { name: 'clear', from: 'yellow', to: 'green'  }
        ]});

    equals(fsm.current, 'green', "initial state should be green");

    fsm.warn();  equals(fsm.current, 'yellow', "warn  event should transition from green  to yellow");
    fsm.panic(); equals(fsm.current, 'red',    "panic event should transition from yellow to red");
    fsm.calm();  equals(fsm.current, 'yellow', "calm  event should transition from red    to yellow");
    fsm.clear(); equals(fsm.current, 'green',  "clear event should transition from yellow to green");

});

//-----------------------------------------------------------------------------

test("targeted state machine", function() {

    StateMachine.create({
        target:  this,
        initial: 'green',
        events: [
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' },
            { name: 'clear', from: 'yellow', to: 'green'  }
        ]});

    equals(this.current, 'green', "initial state should be green");

    this.warn();  equals(this.current, 'yellow', "warn  event should transition from green  to yellow");
    this.panic(); equals(this.current, 'red',    "panic event should transition from yellow to red");
    this.calm();  equals(this.current, 'yellow', "calm  event should transition from red    to yellow");
    this.clear(); equals(this.current, 'green',  "clear event should transition from yellow to green");
});

//-----------------------------------------------------------------------------

test("can & cannot", function() {

    var fsm = StateMachine.create({
        initial: 'green',
        events: [
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' },
        ]});

    equals(fsm.current, 'green', "initial state should be green");

    ok(fsm.can('warn'),     "should be able to warn from green state")
    ok(fsm.cannot('panic'), "should NOT be able to panic from green state")
    ok(fsm.cannot('calm'),  "should NOT be able to calm from green state")

    fsm.warn();
    equals(fsm.current, 'yellow', "current state should be yellow");
    ok(fsm.cannot('warn'),  "should NOT be able to warn from yellow state")
    ok(fsm.can('panic'),    "should be able to panic from yellow state")
    ok(fsm.cannot('calm'),  "should NOT be able to calm from yellow state")

    fsm.panic();
    equals(fsm.current, 'red',  "current state should be red");
    ok(fsm.cannot('warn'),  "should NOT be able to warn from red state")
    ok(fsm.cannot('panic'), "should NOT be able to panic from red state")
    ok(fsm.can('calm'),     "should be able to calm from red state")

});

//-----------------------------------------------------------------------------

test("inappropriate events", function() {

    var fsm = StateMachine.create({
        initial: 'green',
        events: [
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' },
        ]});

    equals(fsm.current, 'green', "initial state should be green");

    raises(fsm.panic.bind(fsm), /event panic inappropriate in current state green/);
    raises(fsm.calm.bind(fsm),  /event calm inappropriate in current state green/);

    fsm.warn();
    equals(fsm.current, 'yellow', "current state should be yellow");
    raises(fsm.warn.bind(fsm), /event warn inappropriate in current state yellow/);
    raises(fsm.calm.bind(fsm), /event calm inappropriate in current state yellow/);

    fsm.panic();
    equals(fsm.current, 'red', "current state should be red");
    raises(fsm.warn.bind(fsm),  /event warn inappropriate in current state red/);
    raises(fsm.panic.bind(fsm), /event panic inappropriate in current state red/);

});

//-----------------------------------------------------------------------------

test("inappropriate event handling can be customized", function() {

    var fsm = StateMachine.create({
        error: function(name, from, to, args, error, msg) { return msg; }, // return error message instead of throwing an exception
        initial: 'green',
        events: [
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' }
        ]});

    equals(fsm.current, 'green', "initial state should be green");

    equals(fsm.panic(), 'event panic inappropriate in current state green');
    equals(fsm.calm(),  'event calm inappropriate in current state green');

    fsm.warn();
    equals(fsm.current, 'yellow', "current state should be yellow");
    equals(fsm.warn(), 'event warn inappropriate in current state yellow');
    equals(fsm.calm(), 'event calm inappropriate in current state yellow');

    fsm.panic();
    equals(fsm.current, 'red', "current state should be red");
    equals(fsm.warn(),  'event warn inappropriate in current state red');
    equals(fsm.panic(), 'event panic inappropriate in current state red');

});

//-----------------------------------------------------------------------------

test("event is cancelable", function() {

    var fsm = StateMachine.create({
        initial: 'green',
        events: [
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' }
        ]});

    equal(fsm.current, 'green', 'initial state should be green');

    fsm.onBeforeWarn = function() { return false; }
    fsm.warn();

    equal(fsm.current, 'green', 'state should STAY green when event is cancelled');

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
            { name: 'clear', from: 'yellow', to: 'green'  }
        ],
        callbacks: {

            onChangeState: function(event,from,to) { called.push('onchange from ' + from + ' to ' + to); },

            onEnterGreen:  function() { called.push('onEnterGreen');     },
            onEnterYellow: function() { called.push('onEnterYellow');    },
            onEnterRed:    function() { called.push('onEnterRed');       },
            onLeaveGreen:  function() { called.push('onLeaveGreen');     },
            onLeaveYellow: function() { called.push('onLeaveYellow');    },
            onLeaveRed:    function() { called.push('onLeaveRed');       },

            onBeforeWarn:  function() { called.push('onBeforeWarn');     },
            onBeforePanic: function() { called.push('onBeforePanic');    },
            onBeforeCalm:  function() { called.push('onBeforeCalm');     },
            onBeforeClear: function() { called.push('onBeforeClear');    },
            onAfterWarn:   function() { called.push('onAfterWarn');      },
            onAfterPanic:  function() { called.push('onAfterPanic');     },
            onAfterCalm:   function() { called.push('onAfterCalm');      },
            onAfterClear:  function() { called.push('onAfterClear');     },

        }
    });

    called = [];
    fsm.warn();
    deepEqual(called, ['onBeforeWarn', 'onLeaveGreen', 'onEnterYellow', 'onchange from green to yellow', 'onAfterWarn']);

    called = [];
    fsm.panic();
    deepEqual(called, ['onBeforePanic', 'onLeaveYellow', 'onEnterRed', 'onchange from yellow to red', 'onAfterPanic']);

    called = [];
    fsm.calm();
    deepEqual(called, ['onBeforeCalm', 'onLeaveRed', 'onEnterYellow', 'onchange from red to yellow', 'onAfterCalm']);

    called = [];
    fsm.clear();
    deepEqual(called, ['onBeforeClear', 'onLeaveYellow', 'onEnterGreen', 'onchange from yellow to green', 'onAfterClear']);

});

//-----------------------------------------------------------------------------

test("callbacks are ordered correctly - for same state transition", function() {

    var called = [];

    var fsm = StateMachine.create({
        initial: 'waiting',
        events: [
            { name: 'data',    from: ['waiting', 'receipt'], to: 'receipt' },
            { name: 'nothing', from: ['waiting', 'receipt'], to: 'waiting' },
            { name: 'error',   from: ['waiting', 'receipt'], to: 'error'   } // bad practice to have event name same as state name - but I'll let it slide just this once
        ],
        callbacks: {
            onChangeState: function(event,from,to) { called.push('onchange from ' + from + ' to ' + to); },

            onEnterWaiting: function() { called.push('onEnterWaiting');   },
            onEnterReceipt: function() { called.push('onEnterReceipt');   },
            onEnterError:   function() { called.push('onEnterError');     },
            onLeaveWaiting: function() { called.push('onLeaveWaiting');   },
            onLeaveReceipt: function() { called.push('onLeaveReceipt');   },
            onLeaveError:   function() { called.push('onLeaveError');     },

            onBeforeData:    function() { called.push('onBeforeData');    },
            onBeforeNothing: function() { called.push('onBeforeNothing'); },
            onBeforeError:   function() { called.push('onBeforeError');   },
            onAfterData:     function() { called.push('onAfterData');     },
            onAfterNothing:  function() { called.push('onAfterNothing');  },
            onAfterError:   function() { called.push('onAfterError');    },
        }
    });

    called = [];
    fsm.data();
    deepEqual(called, ['onBeforeData', 'onLeaveWaiting', 'onEnterReceipt', 'onchange from waiting to receipt', 'onAfterData']);

    called = [];
    fsm.data();                                         // same-state transition
    deepEqual(called, ['onBeforeData', 'onAfterData']); // so NO enter/leave/change state callbacks are fired

    called = [];
    fsm.data();                                         // same-state transition
    deepEqual(called, ['onBeforeData', 'onAfterData']); // so NO enter/leave/change state callbacks are fired

    called = [];
    fsm.nothing();
    deepEqual(called, ['onBeforeNothing', 'onLeaveReceipt', 'onEnterWaiting', 'onchange from receipt to waiting', 'onAfterNothing']);

});

//-----------------------------------------------------------------------------

test("callback arguments are correct", function() {

    var expected = { event: 'startup', from: 'none', to: 'green' }; // first expected callback

    var verify_expected = function(event,from,to,a,b,c) {
        equal(event, expected.event)
        equal(from,  expected.from)
        equal(to,    expected.to)
        equal(a,     expected.a)
        equal(b,     expected.b)
        equal(c,     expected.c)
    };

    var fsm = StateMachine.create({
        initial: 'green',
        events: [
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' },
            { name: 'clear', from: 'yellow', to: 'green'  }
        ],
        callbacks: {

            onChangeState: function(event,from,to,a,b,c) { verify_expected(event,from,to,a,b,c); },

            onEnterGreen:  function(event,from,to,a,b,c) { verify_expected(event,from,to,a,b,c); },
            onEnterYellow: function(event,from,to,a,b,c) { verify_expected(event,from,to,a,b,c); },
            onEnterRed:    function(event,from,to,a,b,c) { verify_expected(event,from,to,a,b,c); },
            onLeaveGreen:  function(event,from,to,a,b,c) { verify_expected(event,from,to,a,b,c); },
            onLeaveYellow: function(event,from,to,a,b,c) { verify_expected(event,from,to,a,b,c); },
            onLeaveRed:    function(event,from,to,a,b,c) { verify_expected(event,from,to,a,b,c); },

            onBeforeWarn:  function(event,from,to,a,b,c) { verify_expected(event,from,to,a,b,c); },
            onBeforePanic: function(event,from,to,a,b,c) { verify_expected(event,from,to,a,b,c); },
            onBeforeCalm:  function(event,from,to,a,b,c) { verify_expected(event,from,to,a,b,c); },
            onBeforeClear: function(event,from,to,a,b,c) { verify_expected(event,from,to,a,b,c); },
            onAfterWarn:   function(event,from,to,a,b,c) { verify_expected(event,from,to,a,b,c); },
            onAfterPanic:  function(event,from,to,a,b,c) { verify_expected(event,from,to,a,b,c); },
            onAfterCalm:   function(event,from,to,a,b,c) { verify_expected(event,from,to,a,b,c); },
            onAfterClear:  function(event,from,to,a,b,c) { verify_expected(event,from,to,a,b,c); }
        }
    });

    expected = { event: 'warn', from: 'green', to: 'yellow', a: 1, b: 2, c: 3 };
    fsm.warn(1,2,3);

    expected = { event: 'panic', from: 'yellow', to: 'red', a: 4, b: 5, c: 6 };
    fsm.panic(4,5,6);

    expected = { event: 'calm', from: 'red', to: 'yellow', a: 'foo', b: 'bar', c: null };
    fsm.calm('foo', 'bar');

    expected = { event: 'clear', from: 'yellow', to: 'green', a: null, b: null, c: null };
    fsm.clear();

});

//-----------------------------------------------------------------------------

test("exceptions in caller-provided callbacks are not swallowed (github issue #17)", function() {

    var fsm = StateMachine.create({
        initial: 'green',
        events: [
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' }
        ],
        callbacks: {
            onEnterYellow: function() { throw 'oops'; }
        }});

    equals(fsm.current, 'green', "initial state should be green");

    raises(fsm.warn.bind(fsm), /oops/);
});

//-----------------------------------------------------------------------------

test("no-op transitions (github issue #5)", function() {

    var fsm = StateMachine.create({
        initial: 'green',
        events: [
            { name: 'noop',  from: 'green',  /* no-op */  },
            { name: 'warn',  from: 'green',  to: 'yellow' },
            { name: 'panic', from: 'yellow', to: 'red'    },
            { name: 'calm',  from: 'red',    to: 'yellow' },
            { name: 'clear', from: 'yellow', to: 'green'  }
        ]});

    equals(fsm.current, 'green', "initial state should be green");

    ok(fsm.can('noop'), "should be able to noop from green state")
    ok(fsm.can('warn'), "should be able to warn from green state")

    fsm.noop(); equals(fsm.current, 'green',  "noop event should not cause a transition (there is no 'to' specified)");
    fsm.warn(); equals(fsm.current, 'yellow', "warn event should transition from green to yellow");

    ok(fsm.cannot('noop'), "should NOT be able to noop from yellow state")
    ok(fsm.cannot('warn'), "should NOT be able to warn from yellow state")

});

//-----------------------------------------------------------------------------

test("wildcard 'from' allows event from any state (github issue #11)", function() {

    var fsm = StateMachine.create({
        initial: 'stopped',
        events: [
            { name: 'prepare', from: 'stopped',      to: 'ready'   },
            { name: 'start',   from: 'ready',        to: 'running' },
            { name: 'resume',  from: 'paused',       to: 'running' },
            { name: 'pause',   from: 'running',      to: 'paused'  },
            { name: 'stop',    from: '*',            to: 'stopped' }
        ]});

    equals(fsm.current, 'stopped', "initial state should be stopped");

    fsm.prepare(); equals(fsm.current, 'ready',   "prepare event should transition from stopped to ready");
    fsm.stop();    equals(fsm.current, 'stopped', "stop event should transition from ready to stopped");

    fsm.prepare(); equals(fsm.current, 'ready',   "prepare event should transition from stopped to ready");
    fsm.start();   equals(fsm.current, 'running', "start event should transition from ready to running");
    fsm.stop();    equals(fsm.current, 'stopped', "stop event should transition from running to stopped");

    fsm.prepare(); equals(fsm.current, 'ready',   "prepare event should transition from stopped to ready");
    fsm.start();   equals(fsm.current, 'running', "start event should transition from ready to running");
    fsm.pause();   equals(fsm.current, 'paused',  "pause event should transition from running to paused");
    fsm.stop();    equals(fsm.current, 'stopped', "stop event should transition from paused to stopped");

});

//-----------------------------------------------------------------------------

test("missing 'from' allows event from any state (github issue #11) ", function() {

    var fsm = StateMachine.create({
        initial: 'stopped',
        events: [
            { name: 'prepare', from: 'stopped',      to: 'ready'   },
            { name: 'start',   from: 'ready',        to: 'running' },
            { name: 'resume',  from: 'paused',       to: 'running' },
            { name: 'pause',   from: 'running',      to: 'paused'  },
            { name: 'stop',    /* any from state */  to: 'stopped' }
        ]});

    equals(fsm.current, 'stopped', "initial state should be stopped");

    fsm.prepare(); equals(fsm.current, 'ready',   "prepare event should transition from stopped to ready");
    fsm.stop();    equals(fsm.current, 'stopped', "stop event should transition from ready to stopped");

    fsm.prepare(); equals(fsm.current, 'ready',   "prepare event should transition from stopped to ready");
    fsm.start();   equals(fsm.current, 'running', "start event should transition from ready to running");
    fsm.stop();    equals(fsm.current, 'stopped', "stop event should transition from running to stopped");

    fsm.prepare(); equals(fsm.current, 'ready',   "prepare event should transition from stopped to ready");
    fsm.start();   equals(fsm.current, 'running', "start event should transition from ready to running");
    fsm.pause();   equals(fsm.current, 'paused',  "pause event should transition from running to paused");
    fsm.stop();    equals(fsm.current, 'stopped', "stop event should transition from paused to stopped");

});

//-----------------------------------------------------------------------------

test("event return values (github issue #12) ", function() {

    var fsm = StateMachine.create({
        initial: 'stopped',
        events: [
            { name: 'prepare', from: 'stopped', to: 'ready'   },
            { name: 'fake',    from: 'ready',   to: 'running' },
            { name: 'start',   from: 'ready',   to: 'running' }
        ],
        callbacks: {
            onBeforeFake: function(event,from,to,a,b,c) { return false;              }, // this event will be cancelled
            onLeaveReady: function(event,from,to,a,b,c) { return StateMachine.ASYNC; } // this state transition is ASYNC
        }
    });

    equals(fsm.current, 'stopped', "initial state should be stopped");

    equals(fsm.prepare(), StateMachine.SUCCEEDED, "expected event to have SUCCEEDED");
    equals(fsm.current,   'ready',                "prepare event should transition from stopped to ready");

    equals(fsm.fake(),    StateMachine.CANCELLED, "expected event to have been CANCELLED");
    equals(fsm.current,   'ready',                "cancelled event should not cause a transition");

    equals(fsm.start(),   StateMachine.ASYNC,     "expected event to cause an ASYNC transition");
    equals(fsm.current,   'ready',                "async transition hasn't happened yet");

    equals(fsm.transition(), StateMachine.SUCCEEDED, "expected async transition to have SUCCEEDED");
    equals(fsm.current,      'running',              "async transition should now be complete");

});

//---------------------------------------------------------------------
test("limit on re-entrance", function () {

    var fsm = StateMachine.create({
        initial:'stopped',
        events:[
            { name:'prepare', from:'stopped', to:'ready'   },
            { name:'start', from:'ready', to:'running' },
            { name:'resume', from:'paused', to:'running' },
            { name:'pause', from:['running', 'paused'], to:'paused'  },
            { name:'stop', /* any from state */  to:'stopped' }
        ],
        stateConfiguration:{
            paused:{maximumReentrance:3}
        }
    });
    equals(fsm.current, 'stopped', "initial state should be stopped");

    fsm.prepare(); equals(fsm.current, 'ready', "prepare event should transition from stopped to ready");
    fsm.start(); equals(fsm.current, 'running', "start event should transition from ready to running");
    fsm.pause(); equals(fsm.current, 'paused', "pause event should transition from running to paused");
    fsm.pause(); equals(fsm.current, 'paused', "should be able to handle second re-entrance");
    fsm.pause(); equals(fsm.current, 'paused', "should be able to handle third re-entrance");
    raises(fsm.pause.bind(fsm), /Maximum re-entrance of 3 for state paused has been reached/);
});

