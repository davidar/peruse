# LWN.net Weekly Edition for March 26, 2015 \[LWN.net\]

## [A trademark battle in the Arduino community]

The [Arduino] has been one of the biggest success stories of the open-hardware movement, but that success does not protect it from internal conflict. In recent months, two of the project’s founders have come into conflict about the direction of future efforts—and that conflict has turned into a legal dispute about who owns the rights to the Arduino trademark.

The current fight is a battle between two companies that both bear the Arduino name: Arduino LLC and Arduino SRL. The disagreements that led to present state of affairs go back a bit further.

The Arduino project grew out of 2005-era course work taught at the Interaction Design Institute Ivrea (IDII) in Ivrea, Italy (using [Processing], [Wiring], and pre-existing microcontroller hardware). After the IDII program was discontinued, the open-hardware Arduino project as we know it was launched by Massimo Banzi, David Cuartielles, and David Mellis (who had worked together at IDII), with co-founders Tom Igoe and Gianluca Martino joining shortly afterward. The project released open hardware designs (including full schematics and design files) as well as the microcontroller software to run on the boards and the desktop IDE needed to program it.

Arduino LLC was incorporated in 2008 by Banzi, Cuartielles, Mellis, Igoe, and Martino. The company is registered in the United States, and it has continued to design the Arduino product line, develop the software, and run the Arduino community site. The hardware devices themselves, however, were manufactured by a separate company, “Smart Projects SRL,” that was founded by Martino. “SRL” is essentially the Italian equivalent of “LLC”—Smart Projects was incorporated in Italy.

This division of responsibilities—with the main Arduino project handling everything except for board manufacturing—may seem like an odd one, but it is consistent with Arduino’s marketing story. From its earliest days, the designs for the hardware have been freely available, and outside companies were allowed to make Arduino-compatible devices. The project has long run a [certification program] for third-party manufacturers interested in using the “Arduino” branding, but allows (and arguably even encourages) informal software and firmware compatibility.

The Arduino branding was not formally registered as a trademark in the early days, however. Arduino LLC [filed] to register the US trademark in April 2009, and it was granted in 2011.

At this point, the exact events begin to be harder to verify, but the original group of founders reportedly had a difference of opinion about how to license out hardware production rights to other companies. Wired Italy [reports] that Martino and Smart Projects resisted the other four founders’ plans to “internationalize” production—although it is not clear if that meant that Smart Projects disapproved of licensing out *any* official hardware manufacturing to other companies, or had some other concern. Heise Online [adds] that the conflict seemed to be about moving some production to China.

What is clear is that Smart Projects filed a [petition] with the US Patent and Trademark Office (USPTO) in October 2014 asking the USPTO to cancel Arduino LLC’s trademark on “Arduino.” Then, in November 2014, Smart Projects changed its company’s name to Arduino SRL. Somewhere around that time, Martino sold off his ownership stake in Smart Projects SRL and new owner Federico Musto was named CEO.

Unsurprisingly, Arduino LLC did not care for the petition to the USPTO and, in January 2015, the company filed a trademark-infringement [lawsuit] against Arduino SRL. Confusing matters further, the re-branded Arduino SRL has set up its own web site using the domain name `arduino.org`, which duplicates most of the site features found on the original Arduino site (`arduino.cc`). That includes both a hardware store and software downloads.

Musto, the new CEO of the company now called Arduino SRL, has a bit of a history with Arduino as well. His other manufacturing business had [collaborated] with Arduino LLC on the design and production of the Arduino Yún, which has received some [criticism] for including proprietary components.

Hackaday has run a two-part series (in [February] and [March]) digging into the ins and outs of the dispute, including the suggestion that Arduino LLC’s recent release of version 1.6.0 of the Arduino IDE was a move intended to block Arduino SRL from hijacking IDE development. Commenter Paul Stoffregen (who was the author of the Heise story above) [noted] that Arduino SRL recently created a fork of the Arduino IDE on GitHub.

Most recently, Banzi broke his silence about the dispute in a [story] published at MAKEzine. There, Banzi claims that Martino secretly filed a trademark application on “Arduino” in Italy in 2008 and told none of the other Arduino founders. He also details a series of unpleasant negotiations between the companies, including Smart Projects stopping the royalty payments it had long sent to Arduino LLC for manufacturing devices and re-branding its boards with the Arduino.org URL.

Users appear to be stuck in the middle. Banzi says that several retail outlets that claim to be selling “official” Arduino boards are actually paying Arduino SRL, not Arduino LLC, but it is quite difficult to determine which retailers are lined up on which side, since there are (typically) several levels of supplier involved. The two Arduino companies’ web sites also disagree about the available hardware, with Arduino.org offering the new [Arduino Zero] model for sale today and Arduino.cc [listing it] as “Coming soon.”

Furthermore, as Hackaday’s March story explains, the recently-released Arduino.cc IDE now reports that boards manufactured by Arduino SRL are “uncertified.” That warning does not prevent users from programming the other company’s hardware, but it will no doubt confuse quite a few users who believe they possess genuine Arduino-manufactured devices.

The USPTO page for Arduino SRL’s petition notes pre-trial disclosure dates have been set for August and October of 2015 (for Arduino SRL and Arduino LLC, respectively), which suggests that this debate is far from over. Of course, it is always disappointing to observe a falling out between project founders, particularly when the project in question has had such an impact on open-source software and open hardware.

One could argue that disputes of this sort are proof that even small projects started among friends need to take legal and intellectual-property issues (such as trademarks) seriously from the very beginning—perhaps Arduino and Smart Projects thought that an informal agreement was all that was necessary in the early days, after all.

But, perhaps, once a project becomes profitable, there is simply no way to predict what might happen. Arduino LLC would seem to have a strong case for continual and rigorous use of the “Arduino” trademark, which is the salient point in US trademark law. It could still be a while before the courts rule on either side of that question, however.

[Comments (5 posted)]

## [Mapping and data mining with QGIS 2.8]

By **Nathan Willis**  
March 25, 2015

[QGIS] is a free-software geographic information system (GIS) tool; it provides a unified interface in which users can import, edit, and analyze geographic-oriented information, and it can produce output as varied as printable maps or map-based web services. The project recently made its first update to be designated a long-term release (LTR), and that release is both poised for high-end usage and friendly to newcomers alike.

The new release is version 2.8, which was unveiled on March 2. An official [change log] is available on the QGIS site, while the release itself was announced primarily through blog posts (such as [this post] by Anita Graser of the project’s steering committee). Downloads are [available] for a variety of platforms, including packages for Ubuntu, Debian, Fedora, openSUSE, and several other distributions.

As the name might suggest, QGIS is a Qt application; the latest release will, in fact, build on both Qt4 and Qt5, although the binaries released by the project come only in Qt4 form at present. 2.8 has been labeled a long-term release (LTR)—which, in this case, means that the project has committed to providing backported bug fixes for one full calendar year, and that the 2.8.x series is in permanent feature freeze. The goal, according to the change log, is to provide a stable version suitable for businesses and deployments in other large organizations. The change log itself points out that the development of quite a few new features was underwritten by various GIS companies or university groups, which suggests that taking care of these organizations’ needs is reaping dividends for the project.

For those new to QGIS (or GIS in general), there is a detailed new-user [tutorial] that provides a thorough walk-through of the data-manipulation, mapping, and analysis functions. Being a new user, I went through the tutorial; although there are a handful of minor differences between QGIS 2.8 and the version used in the text (primarily whether specific features were accessed through a toolbar or right-click menu), on the whole it is well worth the time.

QGIS is designed to make short work of importing spatially oriented data sets, mining information from them, and turning the results into a meaningful visualization. Technically speaking, the visualization output is optional: one could simply extract the needed statistics and results and use them to answer some question or, perhaps, publish the massaged data set as a database for others to use.

But well-made maps are often the easiest way to illuminate facts about populations, political regions, geography, and many other topics when human comprehension is the goal. QGIS makes importing data from databases, web-mapping services (WMS), and even unwieldy flat-file data dumps a painless experience. It handles converting between a variety of map-referencing systems more or less automatically, and allows the user to focus on finding the useful attributes of the data sets and rendering them on screen.

#### Here be data

The significant changes in QGIS 2.8 fall into several categories. There are updates to how QGIS handles the mathematical expressions and queries users can use to filter information out of a data set, improvements to the tools used to explore the on-screen map canvas, and enhancements to the “map composer” used to produce visual output. This is on top of plenty of other under-the-hood improvements, naturally.

In the first category are several updates to the filtering tools used to mine a data set. Generally speaking, each independent data set is added to a QGIS project as its own layer, then transformed with filters to focus in on a specific portion of the original data. For instance, the land-usage statistics for a region might be one layer, while roads and buildings for the same region from OpenStreetMap might be two additional layers. Such filters can be created in several ways: there is a “query builder” that lets the user construct and test expressions on a data layer, then save the results, an SQL console for performing similar queries on a database, and spreadsheet-like editing tools for working directly on data tables.

All three have been improved in this release. New are support for `if(condition, true, false)` conditional statements, a set of operations for geometry primitives (e.g., to test whether regions overlap or lines intersect), and an “integer divide” operation. Users can also add comments to their queries to annotate their code, and there is a new [custom function editor] for writing Python functions that can be called in mathematical expressions within the query builder.

It is also now possible to select only some rows in a table, then perform calculations just on the selection—previously, users would have to extract the rows of interest into a new table first. Similarly, in the SQL editor, the user can highlight a subset of the SQL query and execute it separately, which is no doubt helpful for debugging.

There have also been several improvements to the Python and Processing plugins. Users can now drag-and-drop Python scripts onto QGIS and they will be run automatically. Several new analysis algorithms are now available through the Processing interface that were previously Python-only; they include algorithms for generating grids of points or vectors within a region, splitting layers and lines, generating [hypsometric curves], refactoring data sets, and more.

#### Maps in, maps out

The process of working with on-screen map data picked up some improvements in the new release as well. Perhaps the most fundamental is that each map layer added to the canvas is now handled in its own thread, so fewer hangs in the user interface are experienced when re-rendering a layer (as happens whenever the user changes the look of points or shapes in a layer). Since remote databases can also be layers, this multi-threaded approach is more resilient against connectivity problems, too. The interface also now supports temporary “scratch” layers that can be used to merge, filter, or simply experiment with a data set, but are not saved when the current project is saved.

For working on the canvas itself, polygonal regions can now use raster images (tiled, if necessary) as fill colors, the map itself can be rotated arbitrarily, and objects can be “snapped” to align with items on any layer (not just the current layer). For working with raster image layers (e.g., aerial photographs) or simply creating new geometric shapes by hand, there is a new digitizing tool that can offer assistance by locking lines to specific angles, automatically keeping borders parallel, and other niceties.

There is a completely overhauled “simplify” tool that is used to reduce the number of extraneous vertices of a vector layer (thus reducing its size). The old simplify tool provided only a relative “tolerance” setting that did not correspond directly to any units. With the new tool, users can set a simplification threshold in terms of the underlying map units, layer-specific units, pixels, and more—and, in addition, the tool reports how much the simplify operation has reduced the size of the data.

There has also been an effort to present a uniform interface to one of the most important features of the map canvas: the ability to change the symbology used for an item based on some data attribute. The simplest example might be to change the line color of a road based on whether its road-type attribute is “highway,” “service road,” “residential,” or so on. But the same feature is used to automatically highlight layer information based on the filtering and querying functionality discussed above. The new release allows many more map attributes to be controlled by these “data definition” settings, and provides a hard-to-miss button next to each attribute, through which a custom data definition can be set.

QGIS’s composer module is the tool used to take project data and generate a map that can be used outside of the application (in print, as a static image, or as a layer for [MapServer] or some other software tool, for example). Consequently, it is not a simple select-and-click-export tool; composing the output can involve a lot of choices about which data to make visible, how (and where) to label it, and how to make it generally accessible.

The updated composer in 2.8 now has a full-screen mode and sports several new options for configuring output. For instance, the user now has full control over how map axes are labeled. In previous releases, the grid coordinates of the map could be turned on or off, but the only options were all or nothing. Now, the user can individually choose whether coordinates are displayed on all four sides, and can even choose in which direction vertical text labels will run (so that they can be correctly justified to the edge of the map, for example).

There are, as usual, many more changes than there is room to discuss. Some particularly noteworthy improvements include the ability to save and load bookmarks for frequently used data sources (perhaps most useful for databases, web services, and other non-local data) and improvements to QGIS’s server module. This module allows one QGIS instance to serve up data accessible to other QGIS applications (for example, to simply team projects). The server can now be extended with Python plugins and the data layers that it serves can be styled with style rules like those used in the desktop interface.

QGIS is one of those rare free-software applications that is both powerful enough for high-end work and yet also straightforward to use for the simple tasks that might attract a newcomer to GIS in the first place. The 2.8 release, particularly with its project-wide commitment to long-term support, appears to be an update well worth checking out, whether one needs to create a simple, custom map or to mine a database for obscure geo-referenced meaning.

[Comments (3 posted)]

## [Development activity in LibreOffice and OpenOffice]

By **Jonathan Corbet**  
March 25, 2015

The LibreOffice project was [announced] with great fanfare in September 2010. Nearly one year later, the OpenOffice.org project (from which LibreOffice was forked) [was cut loose from Oracle] and found a new home as an Apache project. It is fair to say that the rivalry between the two projects in the time since then has been strong. Predictions that one project or the other would fail have not been borne out, but that does not mean that the two projects are equally successful. A look at the two projects’ development communities reveals some interesting differences.
#### Release histories

Apache OpenOffice has made two releases in the past year: [4.1] in April 2014 and [4.1.1] (described as “a micro update” in the release announcement) in August. The main feature added during that time would appear to be significantly improved accessibility support.

The release history for LibreOffice tells a slightly different story:

It seems clear that LibreOffice has maintained a rather more frenetic release cadence, generally putting out at least one release per month. The project typically keeps at least two major versions alive at any one time. Most of the releases are of the minor, bug-fix variety, but there have been two major releases in the last year as well.

#### Development statistics

In the one-year period since late March 2014, there have been 381 changesets committed to the OpenOffice Subversion repository. The most active committers are:

> Most active OpenOffice developers
> By changesets
> Herbert Dürr
> 63
> 16.6%
> Jürgen Schmidt             
> 56
> 14.7%
> Armin Le Grand
> 56
> 14.7%
> Oliver-Rainer Wittmann
> 46
> 12.1%
> Tsutomu Uchino
> 33
> 8.7%
> Kay Schenk
> 27
> 7.1%
> Pedro Giffuni
> 23
> 6.1%
> Ariel Constenla-Haile
> 22
> 5.8%
> Andrea Pescetti
> 14
> 3.7%
> Steve Yin
> 11
> 2.9%
> Andre Fischer
> 10
> 2.6%
> Yuri Dario
> 7
> 1.8%
> Regina Henschel
> 6
> 1.6%
> Juan C. Sanz
> 2
> 0.5%
> Clarence Guo
> 2
> 0.5%
> Tal Daniel
> 2
> 0.5%
> By changed lines
> Jürgen Schmidt             
> 455499
> 88.1%
> Andre Fischer
> 26148
> 3.8%
> Pedro Giffuni
> 23183
> 3.4%
> Armin Le Grand
> 11018
> 1.6%
> Juan C. Sanz
> 4582
> 0.7%
> Oliver-Rainer Wittmann
> 4309
> 0.6%
> Andrea Pescetti
> 3908
> 0.6%
> Herbert Dürr
> 2811
> 0.4%
> Tsutomu Uchino
> 1991
> 0.3%
> Ariel Constenla-Haile
> 1258
> 0.2%
> Steve Yin
> 1010
> 0.1%
> Kay Schenk
> 616
> 0.1%
> Regina Henschel
> 417
> 0.1%
> Yuri Dario
> 268
> 0.0%
> tal
> 16
> 0.0%
> Clarence Guo
> 11
> 0.0%

In truth, the above list is not just the most active OpenOffice developers — it is all of them; a total of 16 developers have committed changes to OpenOffice in the last year. Those developers changed 528,000 lines of code, but, as can be seen above, Jürgen Schmidt accounted for the bulk of those changes, which were mostly updates to translation files.

The top four developers in the “by changesets” column all work for IBM, so IBM is responsible for a minimum of about 60% of the changes to OpenOffice in the last year.

The picture for LibreOffice is just a little bit different; in the same one-year period, the project has committed 22,134 changesets from 268 developers. The most active of these developers were:

> Most active LibreOffice developers
> By changesets
> Caolán McNamara
> 4307
> 19.5%
> Stephan Bergmann
> 2351
> 10.6%
> Miklos Vajna
> 1449
> 6.5%
> Tor Lillqvist
> 1159
> 5.2%
> Noel Grandin
> 1064
> 4.8%
> Markus Mohrhard
> 935
> 4.2%
> Michael Stahl
> 915
> 4.1%
> Kohei Yoshida
> 755
> 3.4%
> Tomaž Vajngerl
> 658
> 3.0%
> Thomas Arnhold
> 619
> 2.8%
> Jan Holesovsky
> 466
> 2.1%
> Eike Rathke
> 457
> 2.1%
> Matteo Casalin
> 442
> 2.0%
> Bjoern Michaelsen
> 421
> 1.9%
> Chris Sherlock
> 396
> 1.8%
> David Tardon
> 386
> 1.7%
> Julien Nabet
> 362
> 1.6%
> Zolnai Tamás
> 338
> 1.5%
> Matúš Kukan
> 256
> 1.2%
> Robert Antoni Buj Gelonch
> 231
> 1.0%
> By changed lines
> Lionel Elie Mamane
> 244062
> 12.5%
> Noel Grandin
> 238711
> 12.2%
> Stephan Bergmann
> 161220
> 8.3%
> Miklos Vajna
> 129325
> 6.6%
> Caolán McNamara
> 97544
> 5.0%
> Tomaž Vajngerl
> 69404
> 3.6%
> Tor Lillqvist
> 59498
> 3.1%
> Laurent Balland-Poirier
> 52802
> 2.7%
> Markus Mohrhard
> 50509
> 2.6%
> Kohei Yoshida
> 45514
> 2.3%
> Chris Sherlock
> 36788
> 1.9%
> Peter Foley
> 34305
> 1.8%
> Christian Lohmaier
> 33787
> 1.7%
> Thomas Arnhold
> 32722
> 1.7%
> David Tardon
> 21681
> 1.1%
> David Ostrovsky
> 21620
> 1.1%
> Jan Holesovsky
> 20792
> 1.1%
> Valentin Kettner
> 20526
> 1.1%
> Robert Antoni Buj Gelonch
> 20447
> 1.0%
> Michael Stahl
> 18216
> 0.9%

To a first approximation, the top ten companies supporting LibreOffice in the last year are:

> Companies supporting LibreOffice development
> (by changesets)
> Red Hat
> 8417
> 38.0%
> Collabora ~~Multimedia~~
> 6531
> 29.5%
> (Unknown)
> 5126
> 23.2%
> (None)
> 1490
> 6.7%
> Canonical
> 422
> 1.9%
> Igalia S.L.
> 80
> 0.4%
> Ericsson
> 21
> 0.1%
> Yandex
> 18
> 0.1%
> FastMail.FM
> 17
> 0.1%
> SUSE
> 7
> 0.0%

Development work on LibreOffice is thus concentrated in a small number of companies, though it is rather more spread out than OpenOffice development. It is worth noting that the LibreOffice developers with unknown affiliation, who contributed 23% of the changes, make up 82% of the developer base, so there would appear to be a substantial community of developers contributing from outside the above-listed companies.

#### Some conclusions

Last October, some [concerns] were raised on the OpenOffice list about the health of that project’s community. At the time, Rob Weir [shrugged them off] as the result of a marketing effort by the LibreOffice crowd. There can be no doubt that the war of words between these two projects has gotten tiresome at times, but, looking at the above numbers, it is hard not to conclude that there is an issue that goes beyond marketing hype here.

In the 4½ years since its founding, the LibreOffice project has put together a community with over 250 active developers. There is support from multiple companies and an impressive rate of patches going into the project’s repository. The project’s ability to sustain nearly monthly releases on two branches is a direct result of that community’s work. Swearing at LibreOffice is one of your editor’s favorite pastimes, but it seems clear that the project is on a solid footing with a healthy community.

OpenOffice, instead, is driven by four developers from a single company — a company that appears to have been deemphasizing OpenOffice work for some time. As a result, the project’s commit rate is a fraction of what LibreOffice is able to sustain and releases are relatively rare. As of this writing, the [OpenOffice blog] shows no posts in 2015. In the October discussion, Rob [said] that "the dogs may bark but the caravan moves on." That may be true, but, in this case, the caravan does not appear to be moving with any great speed.

Anything can happen in the free-software development world; it is entirely possible that a reinvigorated OpenOffice.org may yet give LibreOffice a run for its money. But something will clearly have to change to bring that future around. As things stand now, it is hard not to conclude that LibreOffice has won the battle for developer participation.

[Comments (74 posted)]

**Page editor**: Jonathan Corbet  

## Inside this week’s LWN.net Weekly Edition

-   [Security]: Toward secure package downloads; New vulnerabilities in drupal, mozilla, openssl, python-django …
-   [Kernel]: LSFMM coverage: NFS, defragmentation, epoll(), copy offload, and more.
-   [Distributions]: A look at Debian’s 2015 DPL candidates; Debian, Fedora, …
-   [Development]: A look at GlusterFS; LibreOffice Online; Open sourcing existing code; Secure Boot in Windows 10; …
-   [Announcements]: A Turing award for Michael Stonebraker, Sébastien Jodogne, ReGlue are Free Software Award winners, Kat Walsh joins FSF board of directors, Cyanogen, …

**Next page**: [Security&gt;&gt;][Security]  

  [A trademark battle in the Arduino community]: file:///Articles/637755/
  [Arduino]: https://en.wikipedia.org/wiki/Arduino
  [Processing]: https://en.wikipedia.org/wiki/Processing_(programming_language)
  [Wiring]: https://en.wikipedia.org/wiki/Wiring_%28development_platform%29
  [certification program]: http://arduino.cc/en/ArduinoCertified/Products#program
  [filed]: http://tsdr.uspto.gov/#caseNumber=3931675&caseType=US_REGISTRATION_NO&searchType=statusSearch
  [reports]: http://www.wired.it/gadget/computer/2015/02/12/arduino-nel-caos-situazione/
  [adds]: http://www.heise.de/make/meldung/Arduino-gegen-Arduino-Gruender-streiten-um-die-Firma-2549653.html
  [petition]: http://ttabvue.uspto.gov/ttabvue/v?pno=92060077&pty=CAN&eno=1
  [lawsuit]: http://dockets.justia.com/docket/massachusetts/madce/1:2015cv10181/167131
  [collaborated]: http://www.eetimes.com/document.asp?doc_id=1263246
  [criticism]: http://hackaday.com/2015/02/24/is-the-arduino-yun-open-hardware/
  [February]: http://hackaday.com/2015/02/25/arduino-v-arduino/
  [March]: http://hackaday.com/2015/03/12/arduino-v-arduino-part-ii/
  [noted]: http://hackaday.com/2015/02/25/arduino-v-arduino/comment-page-1/#comment-2453084
  [story]: http://makezine.com/2015/03/19/massimo-banzi-fighting-for-arduino
  [Arduino Zero]: http://arduino.org/products/arduino-zero-pro
  [listing it]: http://arduino.cc/en/Main/Products
  [Comments (5 posted)]: file:///Articles/637755/#Comments
  [Mapping and data mining with QGIS 2.8]: file:///Articles/637533/
  [QGIS]: http://qgis.org/
  [change log]: http://qgis.org/en/site/forusers/visualchangelog28/index.html
  [this post]: http://anitagraser.com/2015/03/02/qgis-2-8-ltr-has-landed/
  [available]: http://qgis.org/en/site/forusers/download.html
  [tutorial]: http://docs.qgis.org/testing/en/docs/training_manual/
  [custom function editor]: http://nathanw.net/2015/01/19/function-editor-for-qgis-expressions/
  [hypsometric curves]: http://en.wikipedia.org/wiki/Hypsometric_curve
  [MapServer]: http://mapserver.org/
  [Comments (3 posted)]: file:///Articles/637533/#Comments
  [Development activity in LibreOffice and OpenOffice]: file:///Articles/637735/
  [announced]: file:///Articles/407383/
  [was cut loose from Oracle]: file:///Articles/446093/
  [4.1]: https://blogs.apache.org/OOo/entry/the_apache_openoffice_project_announce
  [4.1.1]: https://blogs.apache.org/OOo/entry/announcing_apache_openoffice_4_1
  [concerns]: file:///Articles/637742/
  [shrugged them off]: file:///Articles/637743/
  [OpenOffice blog]: https://blogs.apache.org/OOo/
  [said]: file:///Articles/637750/
  [Comments (74 posted)]: file:///Articles/637735/#Comments
  [Security]: file:///Articles/637395/
  [Kernel]: file:///Articles/637396/
  [Distributions]: file:///Articles/637397/
  [Development]: file:///Articles/637398/
  [Announcements]: file:///Articles/637399/
