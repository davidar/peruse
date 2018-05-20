---
lang: en
title: 'Saving Data: Reducing the size of App Updates by 65%'
---

*Posted by Andrew Hayden, Software Engineer on Google Play*

Android users are downloading tens of billions of apps and games on Google Play. We’re also seeing developers update their apps frequently in order to provide users with great content, improve security, and enhance the overall user experience. It takes a lot of data to download these updates and we know users care about how much data their devices are using. Earlier this year, we announced that we started using [the bsdiff algorithm][] [(by Colin Percival)][the bsdiff algorithm]. Using bsdiff, we were able to reduce the size of app updates on average by 47% compared to the full APK size.

Today, we’re excited to share a new approach that goes further — **[File-by-File patching]**. App Updates using File-by-File patching are, **on average,** **65% smaller than the full app**, and in some cases more than 90% smaller.

The savings, compared to our previous approach, add up to 6 petabytes of user data saved per day!

In order to get the new version of the app, Google Play sends your device a patch that describes the *differences* between the old and new versions of the app.

Imagine you are an author of a book about to be published, and wish to change a single sentence - it’s much easier to tell the editor which sentence to change and what to change, rather than send an entirely new book. In the same way, patches are much smaller and much faster to download than the entire APK.

**Techniques used in File-by-File patching**

Android apps are packaged as APKs, which are ZIP files with special conventions. Most of the content within the ZIP files (and APKs) is compressed using a technology called [Deflate]. Deflate is really good at compressing data but it has a drawback: it makes identifying changes in the original (uncompressed) content really hard. Even a tiny change to the original content (like changing one word in a book) can make the compressed output of deflate look *completely different*. Describing the differences between the *original* content is easy, but describing the differences between the *compressed* content is so hard that it leads to inefficient patches.

Watch how much the compressed text on the right side changes from a one-letter change in the uncompressed text on the left:

![][1]

File-by-File therefore is based on detecting changes in the uncompressed data. To generate a patch, we first decompress both old and new files before computing the delta (we still use bsdiff here). Then to apply the patch, we decompress the old file, apply the delta to the uncompressed content and then recompress the new file. In doing so, we need to make sure that the APK on your device is a perfect match, byte for byte, to the one on the Play Store (see [APK Signature Schema v2] for why).

When recompressing the new file, we hit two complications. First, Deflate has a number of settings that affect output; and we don’t know which settings were used in the first place. Second, many versions of deflate exist and we need to know whether the version on your device is suitable.

Fortunately, after analysis of the apps on the Play Store, we’ve discovered that recent and compatible versions of deflate based on zlib (the most popular deflate library) account for almost all deflated content in the Play Store. In addition, the default settings (level=6) and maximum compression settings (level=9) are the only settings we encountered in practice.

Knowing this, we can detect and reproduce the original deflate settings. This makes it possible to uncompress the data, apply a patch, and then recompress the data back to *exactly the same bytes* as originally uploaded.

However, there is one trade off; extra processing power is needed on the device. On modern devices (e.g. from 2015), recompression can take a little over a second per megabyte and on older or less powerful devices it can be longer. Analysis so far shows that, on average, if the patch size is halved then the time spent applying the patch (which for File-by-File includes recompression) is doubled.

For now, we are limiting the use of this new patching technology to auto-updates only, i.e. the updates that take place in the background, usually at night when your phone is plugged into power and you’re not likely to be using it. This ensures that users won’t have to wait any longer than usual for an update to finish when manually updating an app.

**How effective is File-by-File Patching?**

Here are examples of app updates already using File-by-File Patching:

+--------------------------+---------------+------------------------------+-----------------------------------------+
| Application              | Original Size | Previous (BSDiff) Patch Size | File-by-File Patch Size (% vs original) |
|                          |               |                              |                                         |
|                          |               | (% vs original)              |                                         |
+--------------------------+---------------+------------------------------+-----------------------------------------+
| [Farm Heroes Super Saga] | 71.1 MB       | 13.4 MB (-81%)               | 8.0 MB (-89%)                           |
+--------------------------+---------------+------------------------------+-----------------------------------------+
| [Google Maps]            | 32.7 MB       | 17.5 MB (-46%)               | 9.6 MB (-71%)                           |
+--------------------------+---------------+------------------------------+-----------------------------------------+
| [Gmail]                  | 17.8 MB       | 7.6 MB (-57%)                | 7.3 MB (-59%)                           |
+--------------------------+---------------+------------------------------+-----------------------------------------+
| [Google TTS]             | 18.9 MB       | 17.2 MB (-9%)                | 13.1 MB (-31%)                          |
+--------------------------+---------------+------------------------------+-----------------------------------------+
| [Kindle]                 | 52.4 MB       | 19.1 MB (-64%)               | 8.4 MB (-84%)                           |
+--------------------------+---------------+------------------------------+-----------------------------------------+
| [Netflix]                | 16.2 MB       | 7.7 MB (-52%)                | 1.2 MB (-92%)                           |
+--------------------------+---------------+------------------------------+-----------------------------------------+

*Disclaimer: if you see different patch sizes when you press “update” manually, that is because we are not currently using File-by-file for interactive updates, only those done in the background.*

**Saving data and making our users (& developers!) happy**

These changes are designed to ensure our community of over a billion Android users use as little data as possible for regular app updates. The best thing is that as a developer you don’t need to do anything. You get these reductions to your update size for free!

If you’d like to know more about File-by-File patching, including the technical details, head over to the [Archive Patcher GitHub project] where you can find information, including the source code. Yes, File-by-File patching is completely open-source!

As a developer if you’re interested in reducing your APK size still further, here are some [general tips on reducing APK size].

![][2]

  [the bsdiff algorithm]: https://android-developers.blogspot.com/2016/07/improvements-for-smaller-app-downloads.html
  [File-by-File patching]: https://github.com/andrewhayden/archive-patcher/blob/master/README.md
  [Deflate]: https://en.wikipedia.org/w/index.php?title=DEFLATE&oldid=735386036
  [1]: https://2.bp.blogspot.com/-chCZZinlUTg/WEcxvJo9gdI/AAAAAAAADnk/3ND_BspqN6Y2j5xxkLFW3RyS2Ig0NHZpQCLcB/s1600/ipsum-opsum.gif
  [APK Signature Schema v2]: https://source.android.com/security/apksigning/v2.html
  [Farm Heroes Super Saga]: https://play.google.com/store/apps/details?id=com.king.farmheroessupersaga&hl=en
  [Google Maps]: https://play.google.com/store/apps/details?id=com.google.android.apps.maps
  [Gmail]: https://play.google.com/store/apps/details?id=com.google.android.gm
  [Google TTS]: https://play.google.com/store/apps/details?id=com.google.android.tts
  [Kindle]: https://play.google.com/store/apps/details?id=com.amazon.kindle
  [Netflix]: https://play.google.com/store/apps/details?id=com.netflix.mediaclient
  [Archive Patcher GitHub project]: https://github.com/andrewhayden/archive-patcher
  [general tips on reducing APK size]: https://developer.android.com/topic/performance/reduce-apk-size.html?utm_campaign=android_discussion_filebyfile_120616&utm_source=anddev&utm_medium=blog
  [2]: https://2.bp.blogspot.com/-5aRh1dM6Unc/WEcNs55RGhI/AAAAAAAADnI/tzr_oOJjZwgWd9Vu25ydY0UwB3eXKupXwCLcB/s1600/image01.png
