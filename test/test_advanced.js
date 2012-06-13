//-----------------------------------------------------------------------------

module("advanced");

//-----------------------------------------------------------------------------

test("multiple 'from' states for the same event", function() {

  var fsm = StateMachine.create({
    initial: 'green',
    events: [
      { name: 'warn',  from: 'green',             to: 'yellow' },
      { name: 'panic', from: ['green', 'yellow'], to: 'red'    },
      { name: 'calm',  from: 'red',               to: 'yellow' },
      { name: 'clear', from: ['yellow', 'red'],   to: 'green'  },
  ]});

  equals(fsm.current, 'green', "initial state should be green");

  ok(fsm.can('warn'),     "should be able to warn from green state")
  ok(fsm.can('panic'),    "should be able to panic from green state")
  ok(fsm.cannot('calm'),  "should NOT be able to calm from green state")
  ok(fsm.cannot('clear'), "should NOT be able to clear from green state")

  fsm.warn();  equals(fsm.current, 'yellow', "warn  event should transition from green  to yellow");
  fsm.panic(); equals(fsm.current, 'red',    "panic event should transition from yellow to red");
  fsm.calm();  equals(fsm.current, 'yellow', "calm  event should transition from red    to yellow");
  fsm.clear(); equals(fsm.current, 'green',  "clear event should transition from yellow to green");

  fsm.panic(); equals(fsm.current, 'red',   "panic event should transition from green to red");
  fsm.clear(); equals(fsm.current, 'green', "clear event should transition from red to green");
   
});

//-----------------------------------------------------------------------------

test("multiple 'to' states for the same event", function() {

  var fsm = StateMachine.create({
    initial: 'hungry',
    events: [
      { name: 'eat',  from: 'hungry',                                to: 'satisfied' },
      { name: 'eat',  from: 'satisfied',                             to: 'full'      },
      { name: 'eat',  from: 'full',                                  to: 'sick'      },
      { name: 'rest', from: ['hungry', 'satisfied', 'full', 'sick'], to: 'hungry'    },
  ]});

  equals(fsm.current, 'hungry');

  ok(fsm.can('eat'));
  ok(fsm.can('rest'));

  fsm.eat();
  equals(fsm.current, 'satisfied');

  fsm.eat();
  equals(fsm.current, 'full');

  fsm.eat();
  equals(fsm.current, 'sick');

  fsm.rest();
  equals(fsm.current, 'hungry');

});

//-----------------------------------------------------------------------------

test("no-op transitions (github issue #5) with multiple from states", function() {

  var fsm = StateMachine.create({
    initial: 'green',
    events: [
      { name: 'warn',  from: 'green',             to: 'yellow' },
      { name: 'panic', from: ['green', 'yellow'], to: 'red'    },
      { name: 'noop',  from: ['green', 'yellow']               }, // NOTE: 'to' not specified
      { name: 'calm',  from: 'red',               to: 'yellow' },
      { name: 'clear', from: ['yellow', 'red'],   to: 'green'  },
  ]});

  equals(fsm.current, 'green', "initial state should be green");

  ok(fsm.can('warn'),     "should be able to warn from green state")
  ok(fsm.can('panic'),    "should be able to panic from green state")
  ok(fsm.can('noop'),     "should be able to noop from green state")
  ok(fsm.cannot('calm'),  "should NOT be able to calm from green state")
  ok(fsm.cannot('clear'), "should NOT be able to clear from green state")

  fsm.noop();  equals(fsm.current, 'green',  "noop  event should not transition");
  fsm.warn();  equals(fsm.current, 'yellow', "warn  event should transition from green  to yellow");

  ok(fsm.cannot('warn'),  "should NOT be able to warn  from yellow state")
  ok(fsm.can('panic'),    "should     be able to panic from yellow state")
  ok(fsm.can('noop'),     "should     be able to noop  from yellow state")
  ok(fsm.cannot('calm'),  "should NOT be able to calm  from yellow state")
  ok(fsm.can('clear'),    "should     be able to clear from yellow state")

  fsm.noop();  equals(fsm.current, 'yellow', "noop  event should not transition");
  fsm.panic(); equals(fsm.current, 'red',    "panic event should transition from yellow to red");

  ok(fsm.cannot('warn'),  "should NOT be able to warn  from red state")
  ok(fsm.cannot('panic'), "should NOT be able to panic from red state")
  ok(fsm.cannot('noop'),  "should NOT be able to noop  from red state")
  ok(fsm.can('calm'),     "should     be able to calm  from red state")
  ok(fsm.can('clear'),    "should     be able to clear from red state")

});

//-----------------------------------------------------------------------------

test("callbacks are called when appropriate for multiple 'from' and 'to' transitions", function() {

  var called = [];

  var fsm = StateMachine.create({
    initial: 'hungry',
    events: [
      { name: 'eat',  from: 'hungry',                                to: 'satisfied' },
      { name: 'eat',  from: 'satisfied',                             to: 'full'      },
      { name: 'eat',  from: 'full',                                  to: 'sick'      },
      { name: 'rest', from: ['hungry', 'satisfied', 'full', 'sick'], to: 'hungry'    },
    ],
    callbacks: {
      onChangeState: function(event,from,to) { called.push('onchange from ' + from + ' to ' + to); },

      onEnterHungry:    function() { called.push('onEnterHungry');    },
      onLeaveHungry:    function() { called.push('onLeaveHungry');    },
      onEnterSatisfied: function() { called.push('onEnterSatisfied'); },
      onLeaveSatisfied: function() { called.push('onLeaveSatisfied'); },
      onEnterFull:      function() { called.push('onEnterFull');      },
      onLeaveFull:      function() { called.push('onLeaveFull');      },
      onEnterSick:      function() { called.push('onEnterSick');      },
      onLeaveSick:      function() { called.push('onLeaveSick');      },

      onBeforeEat:      function() { called.push('onBeforeEat');      },
      onAfterEat:       function() { called.push('onAfterEat');       },
      onBeforeRest:     function() { called.push('onBeforeRest');     },
      onAfterRest:      function() { called.push('onAfterRest');      }
    }
  });

  called = [];
  fsm.eat();
  deepEqual(called, ['onBeforeEat', 'onLeaveHungry', 'onEnterSatisfied', 'onchange from hungry to satisfied', 'onAfterEat']);

  called = [];
  fsm.eat();
  deepEqual(called, ['onBeforeEat', 'onLeaveSatisfied', 'onEnterFull', 'onchange from satisfied to full', 'onAfterEat']);

  called = [];
  fsm.eat();
  deepEqual(called, ['onBeforeEat', 'onLeaveFull', 'onEnterSick', 'onchange from full to sick', 'onAfterEat']);

  called = [];
  fsm.rest();
  deepEqual(called, ['onBeforeRest', 'onLeaveSick', 'onEnterHungry', 'onchange from sick to hungry', 'onAfterRest']);

});

//-----------------------------------------------------------------------------

test("callbacks are called when appropriate for prototype based state machine", function() {

  myFSM = function() {
    this.called = [];
    this.startup();
  };

  myFSM.prototype = {

    onChangeState: function(event,from,to) { this.called.push('onchange from ' + from + ' to ' + to); },

    onEnterGreen:   function() { this.called.push('onEnterGreen');  },
    onLeaveGreen:   function() { this.called.push('onLeaveGreen');  },
    onEnterYellow : function() { this.called.push('onEnterYellow'); },
    onLeaveYellow:  function() { this.called.push('onLeaveYellow'); },
    onEnterRed:     function() { this.called.push('onEnterRed');    },
    onLeaveRed:     function() { this.called.push('onLeaveRed');    },

    onBeforeStartup: function() { this.called.push('onBeforeStartup'); },
    onAfterStartup:  function() { this.called.push('onAfterStartup');  },
    onBeforeWarn:    function() { this.called.push('onBeforeWarn');    },
    onAfterWarn:     function() { this.called.push('onAfterWarn');     },
    onBeforePanic:   function() { this.called.push('onBeforePanic');   },
    onAfterPanic:    function() { this.called.push('onAfterPanic');    },
    onBeforeClear:   function() { this.called.push('onBeforeClear');   },
    onAfterClear:    function() { this.called.push('onAfterClear');    }
  };

  StateMachine.create({
    target: myFSM.prototype,
    events: [
      { name: 'startup', from: 'none',   to: 'green'  },
      { name: 'warn',    from: 'green',  to: 'yellow' },
      { name: 'panic',   from: 'yellow', to: 'red'    },
      { name: 'clear',   from: 'yellow', to: 'green'  }
    ]
  });

  var a = new myFSM();
  var b = new myFSM();

  equal(a.current, 'green', 'start with correct state');
  equal(b.current, 'green', 'start with correct state');

  deepEqual(a.called, ['onBeforeStartup', 'onEnterGreen', 'onchange from none to green', 'onAfterStartup']);
  deepEqual(b.called, ['onBeforeStartup', 'onEnterGreen', 'onchange from none to green', 'onAfterStartup']);

  a.warn();

  equal(a.current, 'yellow', 'maintain independent current state');
  equal(b.current, 'green',  'maintain independent current state');

  deepEqual(a.called, ['onBeforeStartup', 'onEnterGreen', 'onchange from none to green', 'onAfterStartup', 'onBeforeWarn', 'onLeaveGreen', 'onEnterYellow', 'onchange from green to yellow', 'onAfterWarn']);
  deepEqual(b.called, ['onBeforeStartup', 'onEnterGreen', 'onchange from none to green', 'onAfterStartup']);

});



