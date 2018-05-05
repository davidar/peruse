---
author: Dan Goodin
date: 'Apr 16, 2015 8:02 pm UTC'
lang: en
title: 'Just-released Minecraft exploit makes it easy to crash game servers'
---

![][1]

A flaw in the wildly popular online game *Minecraft* makes it easy for just about anyone to crash the server hosting the game, according to a computer programmer who has released proof-of-concept code that exploits the vulnerability.

“I thought a lot before writing this post,” Pakistan-based developer Ammar Askar wrote in a [blog post published Thursday], 21 months, he said, after privately reporting the bug to *Minecraft* developer Mojang. “On the one hand I don’t want to expose thousands of servers to a major vulnerability, yet on the other hand Mojang has failed to act on it.”

The bug resides in the [networking internals of the *Minecraft* protocol]. It allows the contents of inventory slots to be exchanged, so that, among other things, items in players’ hotbars are displayed automatically after logging in. *Minecraft* items can also store arbitrary metadata in a file format known as [Named Binary Tag (NBT)], which allows complex data structures to be kept in hierarchical nests. Askar has released [proof-of-concept attack code] he said exploits the vulnerability to crash any server hosting the game. Here’s how it works.

> The vulnerability stems from the fact that the client is allowed to send the server information about certain slots. This, coupled with the NBT format’s nesting allows us to *craft* a packet that is incredibly complex for the server to deserialize but trivial for us to generate.
>
> In my case, I chose to create lists within lists, down to five levels. This is a json representation of what it looks like.
>
>     rekt: {
>         list: [
>             list: [
>                 list: [
>                     list: [
>                         list: [
>                             list: [
>                             ]
>                             list: [
>                             ]
>                             list: [
>                             ]
>                             list: [
>                             ]
>                             ...
>                         ]
>                         ...
>                     ]
>                     ...
>                 ]
>                 ...
>             ]
>             ...
>         ]
>         ...
>     }
>
> The root of the object, `rekt`, contains 300 lists. Each list has a list with 10 sublists, and each of those sublists has 10 of their own, up until 5 levels of recursion. That’s a total of `10^5 * 300 = 30,000,000` lists.
>
> And this isn’t even the theoretical maximum for this attack. Just the nbt data for this payload is 26.6 megabytes. But luckily Minecraft implements a way to compress large packets, lucky us! zlib shrinks down our evil data to a mere 39 kilobytes.
>
> Note: in previous versions of Minecraft, there was no protocol wide compression for big packets. Previously, NBT was sent compressed with gzip and prefixed with a signed short of its length, which reduced our maximum payload size to `2^15 - 1`. Now that the length is a varint capable of storing integers up to `2^28`, our potential for attack has increased significantly.
>
> When the server will decompress our data, it’ll have 27 megs in a buffer somewhere in memory, but that isn’t the bit that’ll kill it. When it attempts to parse it into NBT, it’ll create java representations of the objects meaning suddenly, the sever is having to create several million java objects including ArrayLists. This runs the server out of memory and causes tremendous CPU load.
>
> This vulnerability exists on almost all previous and current Minecraft versions as of 1.8.3, the packets used as attack vectors are the [0x08: Block Placement Packet] and [0x10: Creative Inventory Action].
>
> The fix for this vulnerability isn’t exactly that hard, the client should never really send a data structure as complex as NBT of arbitrary size and if it must, some form of recursion and size limits should be implemented.
>
> These were the fixes that I recommended to Mojang 2 years ago.

Ars is asking Mojang for comment and will update this post if company officials respond.

  [1]: http://cdn.arstechnica.net/wp-content/uploads/2015/04/server-crash-640x426.jpg
  [blog post published Thursday]: http://blog.ammaraskar.com/minecraft-vulnerability-advisory
  [networking internals of the *Minecraft* protocol]: https://github.com/ammaraskar/pyCraft
  [Named Binary Tag (NBT)]: http://wiki.vg/NBT
  [proof-of-concept attack code]: https://github.com/ammaraskar/pyCraft/tree/nbt_exploit
  [0x08: Block Placement Packet]: http://wiki.vg/Protocol#Player_Block_Placement
  [0x10: Creative Inventory Action]: http://wiki.vg/Protocol#Creative_Inventory_Action
