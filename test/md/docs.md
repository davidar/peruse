---
lang: en
title: 'Guide: installing Windows 95 on DOSBox 0.74'
---

Guide: installing Windows 95 on DOSBox 

This guide is for those who want to get Windows 95 working on DOSBox but don’t want to go through the trouble of looking up all the scattered pieces of 

information that need to be known. It took me a bit of fiddling around, but it turns out it’s actually quite easy. 

This guide may not work if you’re using the last version of Windows 95 (OSR2.5) since that’s essentially an early Windows 98 with IE4 integration. 

![][1]  

Note: Windows 95 on DOSBox is just a toy. It’s not recommended for any serious work. Those who need Windows 95 for some productive purpose, or even 

for running games, are most likely better off using something like Virtualbox or Qemu. 

I don’t know exactly which versions of MS-DOS will work, but I suppose 7 should be fine too. I’ve read that you can cheat Windows into accepting a different 

version by using set ver 6.0, but I can’t confirm this myself since if you use 6.22 you’ll never run into this problem. 

Make sure this file is in your DOSBox directory. 

2\. Make a hard disk image 

You can do this using the bximage program that comes with Bochs. ​[HAL9000’s Megabuild​] contains a built in command for creating these from within DOSBox. 

All you really need to remember when using bximage is the cylinder count, since everything else is standardized and shouldn’t be changed. In my example I’m 

making a 400 MB image which has 812 cylinders (and 16 heads, and 63 sectors per track). Only flat images are supported (as of 0.74)—sparse images will 

not be recognized. However, it’s possible to still compress flat files using your host OS’s filesystem; in Windows installations using an NTFS filesystem, this is 

the default behavior (hence the blue filename). It’s recommended to keep your image relatively small, as a DOSBox bug causes large drives (larger than 

512MB?) to not be completely accessible. 

Copy this file (let’s call it c.img) to your DOSBox directory. 

3\. Mount and format your new hard disk image  

So now we have a hard disk image onto which we’re going to be installing Windows 95. The problem is it doesn’t have a filesystem yet; it’s unformatted. This 

is where our boot disk first comes in.  

Start up DOSBox and type the following:  

imgmount 2 c.img -size 512,63,16,812 -t hdd -fs none 

Note: you may need to replace ​c.img​ with the name you gave your image file, and replace ​812​ with the cylinder count you used when creating the file using 

  [1]: https://ssl.gstatic.com/docs/common/warning.png
  [HAL9000’s Megabuild​]: http://home.arcor.de/h-a-l-9000/
