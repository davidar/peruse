---
lang: en
title: linux video
---

**linux usability  
…or, why do I bother.**  
© 2002, 2003 [Jamie Zawinski]

In December 2002, I tried to install some software on my computer. The experience was, shall we say, less than pleasant. On many levels. I wrote about my experience, as I so often do.

Then in January, the jackasses over at Slashdot [posted] a link to it, calling it a “review” of Linux video software. I guess you could consider it a review, if you were to squint at it just right. But really what it is is a *rant* about how I had an evening stolen from me by crap software design. It is a flame about the pathetic state of Linux usability in general, and the handful of video players I tried out in particular. It makes no attempt to be balanced or objective or exhaustive. It is a description of my experience. Perhaps your experience was different. Good for you.

So of course that day I got hundreds of emails about it. Every Linux apologist in the world wanted to make sure I was fully informed of their opinion. The replies were roughly in the following groups:

-   “Right on! I had exactly the same experience! Thank you for putting it into words.” *(This was about 1/3 of the replies.)*
-   “You’re clearly an idiot, Linux is too sophisticated for you, you clearly are incapable of understanding anything, you should go back to kindergarten and/or use a Mac.” *(Oddly, all of these messages used the word* \`clearly’ *repeatedly.)*
-   “If you don’t like it, fix it yourself.”
-   “Netscape sucks! XEmacs sucks! You suck! I never liked you anyway! And you swear too much!”
-   “How dare you criticize someone else’s work! You got it for free! You should be on your knees thanking them for wasting your time!”
-   “While you have some valid complaints, I’m going to focus on this one inconsequential error you made in your characterization of one of the many roadblocks you encountered. You suck!”
-   “It’s your fault for using Red Hat! You should be using Debian/Mandrake/Gentoo instead!”
-   “Red Hat 7.2 is totally obsolete! It’s almost 14 months old! What were you expecting!”

While I am flattered that so many logorrheic Linux fanboys are sufficiently interested in my opinions and experiences to share their deeply heartfelt views with me, you can all rest assured that:

-   I’ve heard it before; and
-   I didn’t care the first time.

So please. Don’t bother sending me any more mail about this. It’s a near certainty that I will just delete it unread, so you might as well not waste your time. Feel free to call me names on your own web page if you feel the need to get it out of your system. But kindly stay out of my inbox.

**that said…**

I understand that one can play videos on one’s computer. I understand these videos come in many different formats. Every now and then I try to figure out what the Done Thing is, as far as playing movies on one’s Linux machine.

(Really my eventual goal is to be able to *create* video on Linux, but I figured I’d start small, and see if I could just get *playback* working before trying something that is undoubtedly ten thousand times harder.)

I finally found [RPMs] of [mplayer] that would consent to install themselves on a Red Hat 7.2 machine, and actually got it to play some videos. Amazing. But it’s a total pain in the ass to use due to rampant “themeing.” *Why do people do this?* They map this stupid shaped window with no titlebar (oh, sorry, your choice of a dozen stupidly-shaped windows without titlebars) all of which use fonts that are way too small to read. But, here’s the best part, there’s no way to raise the window to the top. So if another window ever gets on top of it, well, sorry, you’re out of luck. And half of the themes always map the window at the very bottom of the screen – conveniently *under* my panel where I can’t reach it.

Resizing the window changes the aspect ratio of the video! Yeah, I’m sure someone has *ever* wanted that.

It moves the mouse to the upper left corner of every dialog box it creates! Which is great, because that means that when it gets into this cute little state of popping up a blank dialog that says “Error” five times a second, you can’t even move the mouse over to another window to kill the program, you have to log in from another machine.

Fucking morons.

So I gave up on that, and tried to install [gstreamer]. Get this. Their propose \`\`solution’’ for distributing binaries on Red Hat systems? They point you at an RPM that installs **apt**, the Debian package system! Yeah, that’s a *good* idea, I want to struggle with two competing packaging systems on my machine just to install a single app. Well, I found some [RPMs][1] for Red Hat 7.2, but apparently they expect you to have already rectally inserted [Gnome2] on that 7.2 system first. Uh, no. I’ve seen the horror of Red Hat 8.0, and there’s no fucking way I’m putting Gnome2 on any more of my machines for at least another six months, maybe a year.

Ok, no gstreamer. Let’s try [Xine]. I found [RPMs][2], and it sucks about the same as mplayer, and in about the same ways, though slightly less bad: it doesn’t screw the aspect ratio when you resize the window; and at least its stupidly-shaped window is always forced to be on top. I don’t like that either, but it’s better than *never* being on top. It took me ten minutes to figure out where the “Open File” dialog was. It’s on the button labeled **`"://"`** whose tooltip says “MRL Browser”. Then you get to select file names from an oh-so-cute window that I guess is supposed to look like a tty, or maybe an LCD screen. It conveniently *centers* the file names in the list, and truncates them at about 30 characters. The scrollbar is also composed of “characters”: it’s an underscore.

*What are these fucktards **thinking???***

Then I checked out [Ogle] again, and it hasn’t been updated since the last time I tried, six months ago. It’s a pretty decent DVD player, if you have the physical DVD. It does on-screen menus, and you can click on them with the mouse. But I don’t need a DVD player (I have a hardware DVD player that works just fine.) It can’t, as far as I can tell, play anything but actual discs.

Oh, and even though I have libdvdcss installed (as evidenced by the fact that Ogle actually works) Xine won’t play the same disc that Ogle will play. It seems to be claiming that the CSS stuff isn’t installed, which it clearly is.

An idiocy that all of these programs have in common is that, in addition to opening a window for the movie, and a window for the control panel, they *also* spray a constant spatter of curses crud on the terminal they were started from. I imagine at some point, there was some user who said, \`\`this program is pretty nice, but you know what it’s missing? It’s missing a lot of pointless chatter about what plugins and fonts have been loaded!’’

------------------------------------------------------------------------

**And here’s the Random Commentary section:**

> **[Makali] wrote:**
>
> *Whenever a programmer thinks, “Hey, skins, what a cool idea”, their computer’s speakers should create some sort of cock-shaped soundwave and plunge it repeatedly through their skulls.*
>
> I am fully in support of this proposed audio-cock technology.
>
> **Various people wrote:**
>
> *You shouldn’t even bother compiling the GUI into mplayer!*
>
> So I should solve the problem of \`\`crappy GUI’‘by replacing it with \`\`no GUI at all?’’ I should use the program only from the command line, or by memorizing magic keystrokes? Awesome idea.
>
> **Various other people wrote:**
>
> True, I hadn’t. Now I have. It has an overly-complicated UI, (the Preferences panel is a festival of overkill) but at least it uses standard menus and buttons, so it doesn’t make you want to claw your eyes out immediately. But, it can only play a miniscule number of video formats, so it’s mostly useless. *\*plonk\**
>
> **Someone else wrote:**
>
> *Have you considered changing distributions?*
>
> Yes, every single time I try something like this, I very seriously consider [getting a Mac].
>
> Really the only thing that’s stopping me is that I fear the [Emacs situation].
>
> (By which I mean, \`\`Lack of a usable version thereof.’’ No, running RMSmacs inside a terminal window doesn’t qualify. Nor does running an X server on the Mac: if I were going to switch, why in the world would I continue inflicting the X Windows Disaster on myself? Wouldn’t getting away from that be the *whole point?*)
>
> (I understand there is an almost-functional Aqua version of [RMSmacs] now. I’ll probably check it out at some point, but the problem with *[me]* switching from XEmacs to RMSmacs is that it would probably result in another [Slashdork][posted] post, meaning I’d wake up to another 150+ poorly spelled flames in my inbox… I’m hoping for a Aquafied XEmacs, but I know that’s not likely to happen any time soon.)
>
> By the way, the suggestion to switch Linux distrubutions in order to get a single app to work might sound absurd at first. And that’s because [it is]. But I’ve been saturated with Unix-peanut-gallery effluvia for so long that it no longer even surprises me when every question – no matter how simple – results in someone suggesting that you either A) patch your kernel or B) change distros. It’s inevitable and inescapable, like Hitler.

------------------------------------------------------------------------

[![\[ up \]]]

  [Jamie Zawinski]: mailto:/dev/null@jwz.org?subject=Please%20delete%20this%20message%20without%20reading%20it.
  [posted]: http://slashdot.org/article.pl?sid=03/01/24/1440207
  [RPMs]: http://mirrors.sctpc.com/dominik/linux/pkgs/mplayer/
  [mplayer]: http://www.mplayerhq.hu/
  [gstreamer]: http://gstreamer.net/
  [1]: http://gstreamer.net/releases/redhat/redhat-72-i386/RPMS.ximian/
  [Gnome2]: http://www.gnome.org/
  [Xine]: http://xinehq.de/
  [2]: http://rpmfind.net/linux/redhat/7.3/en/os/i386/RedHat/RPMS/
  [Ogle]: http://www.dtek.chalmers.se/groups/dvd/
  [Makali]: http://www.lazycat.org/
  [getting a Mac]: ../gruntle/bittybox.html
  [Emacs situation]: http://www.xemacs.org/
  [RMSmacs]: ../hacks/why-cooperation-with-rms-is-impossible.mp3
  [me]: lemacs.html
  [it is]: linux.html
  [\[ up \]]: ../compass1.gif
  [![\[ up \]]]: ../
