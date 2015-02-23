/* All of the following code is the "fake game" behind the sample-demo
   interface. In a complete RemGlk implementation, this code would all be
   whacked out and replaced with a single AJAX call. */

/* Define a whole lot of global variables, representing game state. */

game_metrics = null;
game_streamout_left = new Array();
game_streamout_right = new Array();
game_streamclear_left = false;
game_streamclear_right = false;
game_generation = 1;
game_moves = 1;
game_quotemove = 0;
game_quotehaslink = false;
game_splitwin = false;
game_statusmenu = false;
game_statusmenu_from_left = true;
game_print_left = true;
game_inputgen_left = 0;
game_inputgen_right = 0;
game_inputgen_top = 0;
game_inputline_left = true;
game_inputline_right = true;
game_inputinitial_left = null;
game_inputinitial_right = null;
game_timed_timer = null;
game_simulate_crash = false;
game_simulate_timeout = false;
game_simulate_dialog = false;

game_mood = 0;
game_mood_list = [ 'cheery', 'dopey', 'hungry', 'explodey' ];

function game_version() {
  return ('Release 18; GlkOte library ' + GlkOte.version 
    + '; last updated 6-Feb-2015');
}

function game_n_spaces(count) {
  var arr = [];
  for (var ix=0; ix<count; ix++) {
    arr.push(' ');
  }
  return arr.join('');
}

function game_generate_long_text(count, label) {
  var msg = 'This is a very';
  var opts = [ ' very', ' extremely', ' really', ' seriously', ' awfully' ];
  for (var ix=0; ix<count; ix++) {
    if (Math.random() < 0.01)
      msg += ' wicked';
    var val = Math.floor(Math.random() * opts.length);
    msg += opts[val];
  }
  msg += ' ' + label + '.';
  return msg;
}

function game_clear_window(val) {
  if (game_print_left) {
    game_streamout_left.length = 0;
    game_streamclear_left = true;
  }
  else {
    game_streamout_right.length = 0;
    game_streamclear_right = true;
  }
}

function game_print(val) {
  var ix;
  var stream;

  if (game_print_left)
    stream = game_streamout_left;
  else
    stream = game_streamout_right;

  if (val == null) {
    stream.push({ });
    return;
  }

  if (jQuery.type(val) === 'string') {
    var ls = val.split('\n');
    for (ix=0; ix<ls.length; ix++) {
      if (ls[ix])
        stream.push({ content: ['normal', ls[ix]] });
      else
        stream.push({ });
    }
    return;
  }

  var style = val.style;
  if (!style)
    style = 'normal';
  var el = { style: style, text: val.text };
  if (val.hyperlink)
    el.hyperlink = val.hyperlink;
  var newline = (val.newline == undefined || val.newline);

  if (newline)
    stream.push({ content: [ el ] });
  else
    stream.push({ append: 'true', content: [ el ] });
}

function game_select() {
  if (game_simulate_crash || game_simulate_dialog)
    return;

  game_generation = game_generation+1;

  if (!game_statusmenu) {
    if (!game_inputgen_left) {
      game_inputgen_left = game_generation;
      game_print_left = true;
      if (game_inputline_left)
        game_print('\n>');
      else
        game_print('\nHit a key:>');
    }

    if (game_splitwin && !game_inputgen_right) {
      game_inputgen_right = game_generation;
      game_print_left = false;
      if (game_inputline_right)
        game_print('\n>');
      else
        game_print('\nHit a key:>');
    }
  }
  else {
    if (!game_inputgen_top) {
      game_inputgen_top = game_generation;
    }
  }

  game_print_left = true;

  /* This is not a good example of a minimal window update. It generates
     a "window" element whether any windows have changed or not. */

  var have_quotewin = (game_quotemove == game_moves);

  var metrics = game_metrics;
  var pwidth = metrics.width;
  var pheight = metrics.height;

  /* Defined by the game. */
  var statuslines = (game_statusmenu ? 7 : 2);
  var quotelines  = 2;

  /* The basic schema here that all windows must satisfy is

      metrics.width = (windowwidth + leftedge + rightedge)
      metrics.height = (windowheight + topedge + bottomedge)

     The windowwidth and leftedge go into the window argument (as the
     width and left fields). If a window takes up the full width of the
     port, then leftedge and rightedge are metrics.outspacingx.

     (The window width/height includes charwidth/height plus the
     marginx/y.)
  */

  /* How many pixels are needed for statuslines and quotelines? */
  var statusheight = metrics.gridcharheight*statuslines + metrics.gridmarginy;
  var quoteheight  = metrics.gridcharheight*quotelines + metrics.gridmarginy;

  /* As many characters as fit horizontally given the pixel width. */
  var gridchars = Math.floor((pwidth - (2*metrics.outspacingx+metrics.gridmarginx)) / metrics.gridcharwidth);

  var storytop = (metrics.outspacingy+statusheight+metrics.inspacingy);
  if (have_quotewin)
    storytop = (metrics.outspacingy+statusheight+metrics.inspacingy+quoteheight+metrics.inspacingy);
  var storyright = pwidth;
  if (game_splitwin)
    storyright = Math.round(pwidth/2 + metrics.inspacingx/2);

  var argw = [
    { id: 1, type: 'grid', rock: 11,
      gridheight: statuslines, gridwidth: gridchars,
      left: metrics.outspacingx,
      top: metrics.outspacingy,
      width: pwidth-(2*metrics.outspacingx),
      height: statusheight },
    { id: 2, type: 'buffer', rock: 22,
      left: metrics.outspacingx,
      top: storytop,
      width: storyright-(2*metrics.outspacingx),
      height: pheight-(storytop+metrics.outspacingy) },
  ];
  if (have_quotewin) {
    argw.push({ id: 3, type: 'grid', rock: 33,
      gridheight: quotelines, gridwidth: gridchars,
      left: metrics.outspacingx,
      top: (metrics.outspacingy+statusheight+metrics.inspacingy),
      width: pwidth-(2*metrics.outspacingx),
      height: quoteheight });
  }
  if (game_splitwin) {
    argw.push({ id: 4, type: 'buffer', rock: 44,
      left: storyright+metrics.inspacingx-metrics.outspacingx,
      top: storytop,
      width: pwidth-(storyright+metrics.inspacingx),
      height: pheight-(storytop+metrics.outspacingy) });
  }

  /* This is not a good example of a minimal grid-window update. It
     updates every line, whether that line has changed or not. */

  var statleft = ' The Kitchen';
  var statright = game_moves+' moves';
  if (game_moves == 1)
    statright = 'first move';
  var statmiddle = game_n_spaces(gridchars - (statleft.length+statright.length+1));
  var linelist = [
    { line: 0, content: ['normal', statleft+statmiddle+statright] },
    { line: 1, content: ['normal', ' Your mood: ', 'emphasized', game_mood_list[game_mood] ] }
  ];
  if (game_statusmenu) {
    linelist.push({ line: 2 });
    var ix, val;
    for (ix=0; ix<game_mood_list.length; ix++) {
      val = '    ' + ((ix==game_mood) ? '*' : '-') + ' ';
      linelist.push({ line: 3+ix, content: ['normal', val, ((ix==game_mood) ? 'subheader' : 'normal'), game_mood_list[ix]] });
    }
  }
  var argc = [
    { id: 1, lines: linelist }
  ];

  if (game_streamout_left.length || game_streamclear_left) {
    var obj = { id: 2 };
    if (game_streamout_left.length)
      obj.text = game_streamout_left;
    if (game_streamclear_left)
      obj.clear = 'true';
    argc.push(obj);
  }

  if (game_splitwin) {
    if (game_streamout_right.length || game_streamclear_right) {
      var obj = { id: 4 };
      if (game_streamout_right.length)
        obj.text = game_streamout_right;
      if (game_streamclear_right)
        obj.clear = 'true';
      argc.push(obj);
    }
  }

  if (have_quotewin) {
    var indent = Math.floor((gridchars - '  Pay no attention to the  '.length) / 2);
    indent = game_n_spaces(indent);
    if (!game_quotehaslink) {
      argc.push({ id: 3, lines: [
          { line: 0, content: ['normal', indent,
              'blockquote', '  Pay no attention to the  '] },
          { line: 1, content: ['normal', indent,
              'blockquote', '  man behind the curtain!  '] }
        ] });
    }
    else {
      argc.push({ id: 3, lines: [
          { line: 0, content: ['normal', indent,
              'blockquote', "    'Twas ",
              { style:'blockquote', hyperlink:3, text:'brillig' },
              'blockquote', ", and     "] },
          { line: 1, content: ['normal', indent,
              'blockquote', '     the slithy ',
              { style:'blockquote', hyperlink:4, text:'toves' },
              'blockquote', '...   '] }
        ] });
    }
  }

  var argi = [ ];
  if (!game_statusmenu) {
    var obj =  { id: 2, gen: game_inputgen_left,
      type: (game_inputline_left ? 'line' : 'char'), maxlen: 200,
      hyperlink: true };
    if (game_inputinitial_left)
      obj.initial = game_inputinitial_left;
    argi.push(obj);
  }
  else {
    var obj = { id: 2, hyperlink: true };
    argi.push(obj);
  }
  if (!game_statusmenu && game_splitwin) {
    var obj = { id: 4, gen: game_inputgen_right,
      type: (game_inputline_right ? 'line' : 'char'), maxlen: 200,
      hyperlink: true };
    if (game_inputinitial_right)
      obj.initial = game_inputinitial_right;
    argi.push(obj);
  }
  else {
    var obj = { id: 4, hyperlink: true };
    argi.push(obj);
  }
  if (game_statusmenu) {
    var obj = { id: 1, gen: game_inputgen_top,
      type: 'char', xpos:15, ypos:3+game_mood };
    argi.push(obj);
  }
  if (true) {
    var obj = { id: 3, hyperlink: true };
    argi.push(obj);
  }

  var arg = { type:'update', gen:game_generation, windows:argw, content:argc, input:argi };

  if (game_simulate_timeout) {
    /* If the game were crunching away in another thread, or in another
       process, the library might receive this message instead of a
       real update. */
    arg = { type:'retry' };
    game_simulate_timeout = false;
  }

  GlkOte.update(arg);

  game_streamout_left.length = 0;
  game_streamout_right.length = 0;
  game_streamclear_left = false;
  game_streamclear_right = false;
}

/* This is the function which is handed to the GlkOte library as Game.accept.
   It receives input events from the library, and responds to them by updating
   the display. 
*/
function game_accept(res) {
  if (res.type == 'init') {
    if (res.gen) {
      GlkOte.log('Input event had wrong generation number: got ' + res.gen + ', should be zero for init.');
      return;
    }
  }
  else if (res.type == 'refresh') {
    /* A real game (i.e., a game that was really running as a remote
       process) would call GlkOte.update() and send the sum of all
       content updates since generation res.gen. A Javascript game can't
       easily do that. But the main cause of 'refresh' events is the game
       sending a 'retry' update. A Javascript game won't do that. So we're
       in the clear. 

       (This fake game sends `retry` if the user types "slow". We fake up
       the right(-ish) results.) */
    game_inputgen_left = 0;
    game_inputline_left = true;
    game_inputinitial_left = null;
    game_print_left = true;
    game_print({ newline:false, style:'input', text:'slow' });
    game_print('This message took a very long time to appear.');
  }
  else {
    /* Make sure the user's display was up-to-date when he sent this input
       event. If not, we ignore it -- we got this message out-of-order. */
    if (res.gen != game_generation) {
      GlkOte.log('Input event had wrong generation number: got ' + res.gen + ', currently at ' + game_generation);
      return;
    }

    /* Also, pick up partial inputs for later use. (These don't exist for
       'init' and 'refresh' events.) */
  
    game_inputinitial_left = null;
    game_inputinitial_right = null;
    if (res.partial) {
      game_inputinitial_left  = res.partial[2];
      game_inputinitial_right = res.partial[4];
    }
  }

  if (res.type == 'line') {
    game_submit_line_input(res.window, res.value);
  }
  else if (res.type == 'char') {
    game_submit_char_input(res.window, res.value);
  }
  else if (res.type == 'hyperlink') {
    game_submit_hyperlink_input(res.window, res.value);
  }
  else if (res.type == 'external') {
    if (res.value == 'timer')
      game_submit_timer_input();
  }
  else if (res.type == 'arrange') {
    game_metrics = res.metrics;
    game_inputgen_top = 0;
  }
  else if (res.type == 'init') {
    game_metrics = res.metrics;
    game_print('A hollow voice booooooms out...\n');
    game_print({ style:'header', text:'This Is Not A Real Game' });
    game_print('An interactive Javascript demo by Andrew Plotkin');
    game_print(game_version());
    game_print('(Type "help" for some possible commands.)');
  }

  game_select();
}

function game_submit_line_input(winid, val) {
  if (winid == 2) {
    game_inputgen_left = 0;
    game_inputline_left = true;
    game_inputinitial_left = null;
    game_print_left = true;
  }
  if (winid == 4) {
    game_inputgen_right = 0;
    game_inputline_right = true;
    game_inputinitial_right = null;
    game_print_left = false;
  }

  if (!jQuery.trim(val)) {
    return;
  }

  game_print({ newline:false, style:'input', text:val });

  val = jQuery.trim(val).toLowerCase();
  game_parse(val);
  game_moves = game_moves+1;
}

function game_submit_char_input(winid, val) {
  if (winid == 1) {
    game_inputgen_top = 0;
    if (val == 'down' || val == 'n' || val == 'N') {
      if (game_mood+1 < game_mood_list.length)
        game_mood += 1;
    }
    if (val == 'up' || val == 'p' || val == 'P') {
      if (game_mood > 0)
        game_mood -= 1;
    }
    if (val == 'return' || val == 'q' || val == 'Q') {
      game_statusmenu = false;
      game_print_left = game_statusmenu_from_left;
      game_print('\nYou selected "' + game_mood_list[game_mood] + '".');
    }
    return;
  }

  if (winid == 2) {
    game_inputgen_left = 0;
    game_inputline_left = true;
    game_inputinitial_left = null;
    game_print_left = true;
  }
  if (winid == 4) {
    game_inputgen_right = 0;
    game_inputline_right = true;
    game_inputinitial_right = null;
    game_print_left = false;
  }

  if (val == ' ')
    val = '<space>';
  else if (val.length > 1)
    val = '<' + val + '>';
  else if (val.charCodeAt(0) < 32)
    val = '<ctrl-' + String.fromCharCode(val.charCodeAt(0) + 64) + '>';
  game_print('\nYou hit: ' + val);
}

function game_submit_hyperlink_input(winid, val) {
  var toright = false;
  var msg;
  
  if (val == 1)
    msg = 'a borogove';
  else if (val == 2)
    msg = 'a rath';
  else if (val == 3)
    msg = 'brillig';
  else if (val == 4)
    msg = 'a tove';
  else
    msg = 'BUG';

  if (winid == 4)
    toright = true;
  if (winid == 3)
    msg = msg + ' (in the quote window)';

  if (!toright) {
    game_inputgen_left = 0;
    game_inputline_left = true;
    game_print_left = true;
  }
  else {
    game_inputgen_right = 0;
    game_inputline_right = true;
    game_print_left = false;
  }

  game_print('You clicked on ' + msg + '.');
}

function game_submit_timer_input() {
  game_inputgen_left = 0;
  game_inputline_left = true;
  game_print_left = true;
  game_print('The timer has gone off. Ding!');
}

function game_file_load_selected(ref) {
  if (!ref) {
    game_print('Selection cancelled.');
  }
  else {
    game_print('Loading data from file "' + ref.filename + '":');
    var arr = Dialog.file_read(ref);
    if (arr == null) {
      game_print('...but it failed to load?');
    }
    else {
      var savedat = String.fromCharCode.apply(this, arr);
      game_print('"' + savedat + '"');
    }
  }
  game_simulate_dialog = false;
  game_select();
}

function game_file_save_selected(ref) {
  if (!ref) {
    game_print('Selection cancelled.');
  }
  else {
    game_print('Saving data to file "' + ref.filename + '".');
    var savedat = 'Data saved at ' + Date();
    var arr = [];
    for (var ix=0; ix<savedat.length; ix++)
      arr[ix] = savedat.charCodeAt(ix);
    Dialog.file_write(ref, arr);
  }
  game_simulate_dialog = false;
  game_select();
}

function game_parse(val) {
  if (val == 'help' || val == 'about' || val == '?') {
    game_print('This is an interface demo of the RemGlk Javascript front end. There is no IF interpreter behind the display library -- just a few lines of Javascript. It accepts some commands which demonstrate the capabilities of the display system.\n');

    helpopt = function(cmd, val) {
      game_print({ text: '    '});
      game_print({ newline:false, style:'subheader', text: cmd});
      game_print({ newline:false, text: ': ' + val});
    }

    helpopt('help',    'this list');
    helpopt('long',    'a long paragraph of text');
    helpopt('page',    'a couple of pages of short lines');
    helpopt('clear',   'clear the story window');
    helpopt('unicode', 'some accented and non-English characters');
    helpopt('map',     'a diagram in a fixed-width font');
    helpopt('preload', 'pre-load the next prompt with a command');
    helpopt('char',    'get one keystroke of input');
    helpopt('menu',    'pause the game for menu input');
    helpopt('quote',   'display a header pane with a centered box quote');
    helpopt('link',    'hyperlinks in the story window and quote box');
    helpopt('split',   'open a second story window');
    helpopt('unsplit', 'close the second story window');
    helpopt('both',    'print output in both story windows');
    helpopt('bothlong','print long output in both story windows');
    helpopt('timer',   'set a timed event to fire in two seconds');
    helpopt('save, load',  'open a file dialog');
    helpopt('script',  'write a fake transcript file');
    helpopt('crash',   'react as if the game had crashed');
    helpopt('slow',    'react as if the game were taking a long time to compute its output');
    helpopt('todo',    'what do I still need to fix in this interface?');
    return;
  }

  if (val == 'todo') {
    game_print('To do list:\n');
    game_print('    re-lay out windows correctly after "make font bigger" menu command (or if external script code resizes the gameport)');
    game_print('    support indentation and text-alignment in styles');
    game_print('    pictures, sound');
    return;
  }

  if (val == 'map') {
    game_print('You consult your ASCII-art parchment:\n');
    game_print({ style:'preformatted', text:'  +-------+' });
    game_print({ style:'preformatted', text:'  |       |' });
    game_print({ style:'preformatted', text:'  |  _O/  |' });
    game_print({ style:'preformatted', text:'  |   |   |' });
    game_print({ style:'preformatted', text:'  |  / \\  |' });
    game_print({ style:'preformatted', text:'  +-------+' });
    game_print({ style:'preformatted', text:'  [DUDEMAP]' });
    return;
  }

  if (val == 'link' || val == 'links') {
    game_print('You could ');
    game_print({ newline:false, hyperlink:1, style:'normal', text: 'click here'});
    game_print({ newline:false, text:' for a borogove. '});
    game_print({ newline:false, style:'emphasized', text: 'Or you could '});
    game_print({ newline:false, hyperlink:2, style:'emphasized', text: 'click'});
    game_print({ newline:false, hyperlink:2, style:'normal', text: ' here'});
    game_print({ newline:false, text:' for a mome rath. (Note that the italics end in the middle of the second link.)\n'});
    game_print('\nIn this paragraph, http://eblong.com/zarf/glk/glkote.html is an external URL. ');
    game_print({ newline:false, style:'preformatted', text: 'http://eblong.com/zarf/glk/glkote.html'});
    game_print({ newline:false, text:' is an external URL set off by a distinct style. (External hyperlinks may be clickable or not, depending on GlkOte\'s configuration.)\n'});
    game_quotemove = game_moves+1;
    game_quotehaslink = true;
    return;
  }

  if (val == 'long' || val == 'wide') {
    var msg = game_generate_long_text(150, 'long line of text');
    game_print(msg);
    return;
  }

  if (val == 'page' || val == 'tall') {
    var arr = [];
    for (var ix=0; ix<150; ix++)
      arr.push('Line ' + ix + '...');
    var msg = arr.join('\n') + '\nThat is all.';
    game_print(msg);
    return;
  }

  if (val == 'split') {
    if (game_splitwin) {
      game_print('The story window is already split.');
    }
    else {
      game_print('You now have two story windows. Each can accept input independently.');
      game_splitwin = true;
      game_print_left = false;
      game_print('A hollow voice says, "Tool."');
    }
    return;
  }

  if (val == 'unsplit') {
    if (!game_splitwin) {
      game_print('The story window is not currently split.');
    }
    else {
      if (!game_print_left) {
        game_inputgen_left = 0;
        game_inputline_left = true;
        /* leave game_inputinitial_left as set */
        game_print_left = true;
      }
      game_print('The right-hand story window is now gone.');
      game_splitwin = false;
      game_inputgen_right = 0;
      game_inputline_right = true;
      game_inputinitial_right = null;
      game_streamout_right.length = 0;
    }
    return;
  }

  if (val == 'both') {
    if (!game_splitwin) {
      game_print('The story window is not currently split.');
      return;
    }

    game_inputgen_left = 0;
    game_inputgen_right = 0;
    game_inputline_left = true;
    game_inputline_right = true;
    /* leave game_inputinitial_left/right as set */
    var printtmp = game_print_left;
    game_print_left = true;
    game_print('This message appears both here and in the right-hand window.');
    game_print_left = false;
    game_print('This message appears both here and in the left-hand window.');
    game_print_left = printtmp;
    return;
  }

  if (val == 'bothlong' || val == 'longboth') {
    if (!game_splitwin) {
      game_print('The story window is not currently split.');
      return;
    }

    var msg1 = game_generate_long_text(150, 'long line of text, in the primary window');
    var msg2 = game_generate_long_text(120, 'long line of text (although not quite as long) in the secondary window');

    game_inputgen_left = 0;
    game_inputgen_right = 0;
    game_inputline_left = true;
    game_inputline_right = true;
    /* leave game_inputinitial_left/right as set */
    var printtmp = game_print_left;
    game_print_left = true;
    game_print(printtmp ? msg1 : msg2);
    game_print_left = false;
    game_print(printtmp ? msg2 : msg1);
    game_print_left = printtmp;
    return;
  }

  if (val == 'clear') {
    game_print('This text appears before the window is cleared. You shouldn\'t see it at all.');
    game_clear_window();
    game_print('The window has been cleared.');
    return;
  }

  if (val == 'char') {
    if (game_print_left) {
      game_inputgen_left = 0;
      game_inputline_left = false;
      game_inputinitial_left = null;
    }
    else {
      game_inputgen_right = 0;
      game_inputline_right = false;
      game_inputinitial_right = null;
    }
    return;
  }

  if (val == 'preload') {
    game_print('I bet you would like to "look" now.');

    if (game_print_left) {
      game_inputgen_left = 0;
      game_inputline_left = true;
      game_inputinitial_left = 'look';
    }
    else {
      game_inputgen_right = 0;
      game_inputline_right = true;
      game_inputinitial_right = 'look';
    }
    return;
  }

  if (val == 'menu') {
    if (game_statusmenu) {
      game_print('BUG: You should not be able to request menu input when the menu is up.');
      return;
    }

    game_statusmenu = true;
    game_inputgen_top = 0;
    game_inputgen_left = 0;
    game_inputgen_right = 0;
    game_inputline_left = true;
    game_inputline_right = true;
    game_inputinitial_left = null;
    game_inputinitial_right = null;
    game_statusmenu_from_left = game_print_left;
    var printtmp = game_print_left;
    game_print('Select an option with the arrow keys; accept by hitting Return. (N, P, and Q will also work.) Waiting...');
    if (game_splitwin) {
      game_print_left = !game_print_left;
      game_print('Awaiting menu selection...');
    }
    game_print_left = printtmp;
    return;
  }

  if (val == 'quote') {
    game_quotemove = game_moves+1;
    game_quotehaslink = false;
    game_print('Here\'s a quotation box. It will last until your next command.');
    return;
  }

  if (val == 'unicode') {
    game_print('This displays some Unicode characters. It\'s not much of a test, since Javascript supports Unicode natively; either your browser can display these characters or it can\'t.\n');
    game_print('Vowels with umlauts: \u00E4 \u00EB \u00EF \u00F6 \u00FC    Greek: \u03B1\u03B2\u03B3\u03B4\u03B5 (abgde)');
    game_print('Hebrew: \u05D0\u05D1\u05D2\u05D3\u05DE (abgdm... the aleph should be on the right)');
    game_print('Hiragana: \u304A\u3059\u3082 (O SU MO)    Katakana: \u30AA\u30B9\u30E2 (O SU MO)');
    game_print('Punctuation: \u2018single curly quotes\u2019 \u201Cdouble curly quotes\u201D');
    return;
  }

  if (val == 'timer') {
    if (game_timed_timer) {
      game_print('One at a time, please.');
      return;
    }
    game_print('Waiting two seconds...');
    var delayfunc = function() {
      game_timed_timer = null;
      GlkOte.extevent('timer');
    };
    game_timed_timer = window.setTimeout(delayfunc, 2*1000);
    return;
  }

  if (val == 'load') {
    if (!window.Dialog) {
      game_print('The "dialog.js" script was not loaded by this page, so you cannot test the file-selection dialog.');
      return;
    }
    try {
      Dialog.open(false, 'save', 'sample-demo', game_file_load_selected);
    }
    catch (ex) {
      game_print('Your browser does not support game-loading.');
      return;
    }
    game_simulate_dialog = true;
    GlkOte.update({ type:'update', disable:true });
    return;
  }

  if (val == 'save') {
    if (!window.Dialog) {
      game_print('The "dialog.js" script was not loaded by this page, so you cannot test the file-selection dialog.');
      return;
    }
    try {
      Dialog.open(true, 'save', 'sample-demo', game_file_save_selected);
    }
    catch (ex) {
      game_print('Your browser does not support game-saving.');
      return;
    }
    game_simulate_dialog = true;
    GlkOte.update({ type:'update', disable:true });
    return;
  }

  if (val == 'script') {
    var ref = Dialog.file_construct_ref('test-script', 'transcript', 'sample-demo');
    if (Dialog.file_ref_exists(ref)) {
      game_print('File already exists; deleting...');
      Dialog.file_remove_ref(ref);
    }
    var scriptdat = 'This is a fake transcript.\nIt was written out at ' + Date() + '.\n';
    var arr = [];
    for (var ix=0; ix<scriptdat.length; ix++)
      arr[ix] = scriptdat.charCodeAt(ix);
    Dialog.file_write(ref, arr);
    game_print('Wrote a transcript file named "test-script".');
    return;
  }

  if (val == 'look' || val == 'l') {
    game_print();
    if (game_print_left) {
      game_print({ style:'subheader', text:'The Kitchen' });
      game_print('This is a three-hundred-foot wide cube of bare white plaster, with a refrigerator painted on one wall. You don\'t know if that\'s sufficient to make it count as a kitchen. Better than calling it the "White Cube Room" or "Chamber of the Lazy Implementor".');
    }
    else {
      game_print({ style:'subheader', text:'Tomb of the Unknown Tool' });
      game_print('This is a dank hole equipped with dripping walls, grue fewmets, and a desk. The only exit is fenced over.');
    }
    return;
  }

  if (val == 'inventory' || val == 'inv' || val == 'i') {
    game_print('You ain\'t got a thing if you don\'t got that bling.');
    return;
  }

  if (val == 'version') {
    game_print(game_version());
    return;
  }

  if (val == 'crash') {
    /* This simulates the case where RemGlk, on the other end of the line,
       has died; we never get another Game.update. */
    GlkOte.update({ type:'error', 
      message:'The game has pretended to crash.' });
    game_simulate_crash = true;
    return;
  }

  if (val == 'slow') {
    if (!game_print_left) {
      game_print('You can\'t type "slow" in the right-hand window. The reasons are tedious and contrived. Sorry about that.');
      return;
    }
    game_simulate_timeout = true;
    game_moves += 9;
    return;
  }

  game_print('I don\'t know how to "' + val + '". Try "help".');
}
