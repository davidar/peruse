# How to build your own VPN if you’re (rightfully) wary of commercial options

#### Gear & Gadgets —

## While not perfect, either, cloud hosting providers have a better customer data record.

![Aurich / Thinkstock]

In the wake of this spring’s [Senate ruling] nixing FCC privacy regulations imposed on ISPs, you may be (even more) worried about how your data is used, misused, and abused. There have been a lot of opinions on this topic since, ranging from “the sky is falling” to “[move along, citizen, nothing to see here].” The fact is, ISPs tend to be pretty unscrupulous, sometimes even ruthless, about how they gather and use their customers’ data. You may not be sure how it’s a problem if your ISP gives advertisers more info to serve ads you’d like to see—but what about when your ISP literally [*edits*] your HTTP traffic, [inserting *more* ads] and possibly breaking webpages?

With a Congress that has demonstrated its lack of interest in protecting you from your ISP, and ISPs that have repeatedly demonstrated a “whatever-we-can-get-away-with” attitude toward customers’ data privacy and integrity, it may be time to look into how to get your data out from under your ISP’s prying eyes and grubby fingers intact. To do that, you’ll need a VPN.

## The scope of the problem (and of the solution)

Before you can fix this problem, you need to understand it. That means knowing what your ISP can (and cannot) detect (and modify) in your traffic. HTTPS traffic is already relatively secure—or, at least, its *content* is. Your ISP can’t actually read the encrypted traffic that goes between you and an HTTPS website (at least, they can’t unless they convince you to install a MITM certificate, like [Lenovo did to unsuspecting users of its consumer laptops] in 2015). However, ISPs *do* know that you visited that website, when you visited it, how long you stayed there, and how much data went back and forth.

They know this a couple of ways. First, if your website uses [Server Name Indication] (SNI) to allow multiple HTTPS sites to be served from a single IP address, the hostname is sent in the clear so that the server knows which certificate to use for the connection. Second, and more importantly, your DNS traffic gives you away. Whether you’re going to Amazon.com or BobsEmporiumOfDiscountFurryMemorabilia.com, your computer needs to resolve that domain name to an IP address. That’s done in the clear, meaning it’s easily intercepted (and even changeable in flight!) by your ISP (or any other [MITM]) whether you’re actually using your ISP’s DNS servers or not.

This is already enough to build a valuable profile on you for advertising purposes. Depending on your level of paranoia, it’s also enough to build a profile on you for blackmail purposes or to completely compromise your Web traffic if you aren’t incredibly careful and observant. Imagine an attacker [has the use of a Certificate Authority to generate their own (valid!) certificates]; with both that and DNS, they can easily redirect you to a server of their own choosing, which uses a certificate your browser trusts to set up an invisible proxy between you and the site you’re trying to securely access. Even without the use of a rogue CA, control of your DNS makes it easier for an attacker to use [punycode domain names] and similar tricks to slide under your radar.

Beyond that, any unencrypted traffic—including but not limited to HTTP (plain old port 80 Web traffic), much peer-to-peer traffic, and more—can be simply edited on-the-fly directly. Which, may I remind you, ISPs have repeatedly [demonstrated themselves][inserting *more* ads] as perfectly willing to do.

You can’t protect yourself from *all* potential attackers. Unfortunately, an awful lot of the critical infrastructure of your access to the Web *is* unencrypted and really *cannot* be secured. As a person with limited resources who can’t afford to consider personal security more than a part-time job, you (and I) are unfortunately closer to Secret Squirrel than to James Bond. You can, however, move your vulnerable, unencrypted transmissions out of your *ISP’s* reach. So that’s what we’ll aim to do here.

![[Enlarge] / If you think this will be secure, please read on.]

## A problem of trust

We’ve already established—actually, your *ISP* has already established—that your ISP cannot be trusted. The obvious solution, then, is a VPN, a Virtual Private Network, that tunnels all of your vulnerable, unencrypted data outside the ISP’s reach. The problem is, that data will be just as vulnerable when it exits the endpoint. Essentially, you’ve traded one set of vulnerabilities for another, hopefully less-troublesome set.

Imagine you’ve got a particularly pesky evil genius of a little brother who has learned how to tap the network traffic coming out of your room and who delights in embarrassing you at school with the gossip you shared privately (or so you thought) with your friends. One of those friends says, “Hey, how about you just setup a VPN between your house and mine? Then everything coming out of your room will be encrypted, and your little brother can’t mess with it.” So far, so good, but then it turns out that friend has a pesky evil genius of a little *sister*, and now *she’s* reading your IMs and passing the juicy bits back to your little brother. In the end, you’re no better than you started off.

This is the situation you’re in today [when you start looking at VPN providers][]: perhaps they’re trustworthy, perhaps they’re not. Unfortunately, the very same characteristics that make them attractive (claims not to log your traffic, no good relationships with authorities, presence in a lot of countries, inexpensive plans) make them… dubious. How do you *know* the company with the offices in Moldova that is charging you \$2/mo for all the bandwidth you can eat isn’t actually monetizing your data just like your ISP did, or maybe even worse? Has anybody audited *their* facilities to independently verify any claims of zero logging? Probably not.

Now, a VPN called Private Internet Access recently made a few waves by standing up to an FBI subpoena to some degree. In a case surrounding a possible bomb threat hoax ([PDF]), Private Internet Access appears to [have made good on its no logging claims]. According to the [criminal complaint], “a subpoena was sent to London Trust Media and the only information they could provide is that the cluster of IP addresses being used was from the east coast of the United States.”

Does this mean everyone can trust VPNs in general? Of course not. And as for Private Internet Access specifically, one public success doesn’t necessarily remove all doubt—prosecutors in the case didn’t push any further given they had plenty of other evidence to support their argument. So if you can’t trust your ISP and you can’t trust a VPN provider either, what’s the plan *then?* Well, you’re left with an option possibly not suitable for your average Internet user: roll your own VPN at an inexpensive cloud hosting provider like Linode or Digital Ocean.

There are no absolute guarantees with this avenue, either, But while you probably can’t avoid your local ISP (few of us have more than two choices, if that), the Internet is full of hosting providers. It’s a much bigger deal if one of them generates a lot of customer anger for messing around with customer data. These companies are also less likely to roll over quickly for improperly tendered law enforcement requests than a typical ISP (although, again, there are no guarantees). Getting your data safely away from a predatory ISP is one thing; getting it away from a nation-state adversary or [APT] that truly *wants* it is [something else entirely] and probably beyond our scope.

Page: 1 [2][] [3][] [4][] [5][] [Next →][2]

[Next Page][2]

  [Aurich / Thinkstock]: https://web.archive.org/web/20170528060457im_/https://cdn.arstechnica.net/wp-content/uploads/2017/05/vpn-privacy-800x450.jpg
  [Senate ruling]: https://web.archive.org/web/20170528060457/https://arstechnica.com/information-technology/2017/03/how-isps-can-sell-your-web-history-and-how-to-stop-them/
  [move along, citizen, nothing to see here]: https://web.archive.org/web/20170528060457/https://cei.org/blog/six-reasons-fcc-rules-aren%E2%80%99t-needed-protect-privacy
  [*edits*]: https://web.archive.org/web/20170528060457/https://arstechnica.com/tech-policy/2014/09/why-comcasts-javascript-ad-injections-threaten-security-net-neutrality/
  [inserting *more* ads]: https://web.archive.org/web/20170528060457/https://arstechnica.com/tech-policy/2014/09/meet-the-tech-company-performing-ad-injections-for-big-cable/
  [Lenovo did to unsuspecting users of its consumer laptops]: https://web.archive.org/web/20170528060457/https://arstechnica.com/security/2015/02/lenovo-pcs-ship-with-man-in-the-middle-adware-that-breaks-https-connections/
  [Server Name Indication]: https://web.archive.org/web/20170528060457/https://en.wikipedia.org/wiki/Server_Name_Indication
  [MITM]: https://web.archive.org/web/20170528060457/https://en.wikipedia.org/wiki/Man-in-the-middle_attack
  [has the use of a Certificate Authority to generate their own (valid!) certificates]: https://web.archive.org/web/20170528060457/https://arstechnica.com/security/2016/09/firefox-ready-to-block-certificate-authority-that-threatened-web-security/
  [punycode domain names]: https://web.archive.org/web/20170528060457/https://arstechnica.com/security/2017/04/chrome-firefox-and-opera-users-beware-this-isnt-the-apple-com-you-want/
  [Enlarge]: https://web.archive.org/web/20170528060457/https://cdn.arstechnica.net/wp-content/uploads/2015/06/freewifi.jpg
  [[Enlarge] / If you think this will be secure, please read on.]: https://web.archive.org/web/20170528060457im_/https://cdn.arstechnica.net/wp-content/uploads/2015/06/freewifi-640x425.jpg
  [when you start looking at VPN providers]: https://web.archive.org/web/20170528060457/https://arstechnica.com/security/2016/06/aiming-for-anonymity-ars-assesses-the-state-of-vpns-in-2016/
  [PDF]: https://web.archive.org/web/20170528060457/https://www.scribd.com/doc/303226103/Fake-bomb-threat-arrest
  [have made good on its no logging claims]: https://web.archive.org/web/20170528060457/https://torrentfreak.com/vpn-providers-no-logging-claims-tested-in-fbi-case-160312/
  [criminal complaint]: https://web.archive.org/web/20170528060457/https://www.unitedstatescourts.org/federal/flsd/480077/1-0.html
  [APT]: https://web.archive.org/web/20170528060457/https://en.wikipedia.org/wiki/Advanced_persistent_threat
  [something else entirely]: https://web.archive.org/web/20170528060457/https://xkcd.com/538/
  [2]: https://web.archive.org/web/20170528060457/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/2/
  [3]: https://web.archive.org/web/20170528060457/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/3/
  [4]: https://web.archive.org/web/20170528060457/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/4/
  [5]: https://web.archive.org/web/20170528060457/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/5/
