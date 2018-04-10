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

#### Gear & Gadgets —

## While not perfect, either, cloud hosting providers have a better customer data record.

![[Enlarge][1] / Actual slide from the Snowden leaks: dramatization of what nation-states do when they come across users not even trying.]

## Grab an SSH key and get started

When it comes to hosting, there are plenty of great providers out there, and in particular I’ve used both Digital Ocean and Linode extensively. Both offer instances starting at \$5/mo with multiple data centers and great management features. For this project, I chose Digital Ocean, but either (or any of several others) will do.

Before we start setting up a VM, though, let’s make sure we can access it securely. If you’ve already got an SSH key and know how to use it, great. If not, you’ll need to make one. On Linux or a Mac, get to the shell and type in **ssh-keygen -t rsa**. This will create an SSH keypair and give you the option of adding a challenge phrase, which I highly recommend. Without the challenge phrase, anybody who has the files comprising the keypair can log in as you immediately; *with* the challenge phrase, even an attacker with possession of the key can’t get in unless they already know your challenge as well (which is never stored anywhere).

On Windows, it’s a bit more complicated. [Download PuTTY] if you don’t already have it, then follow [DigitalOcean’s guide to generating SSH keys with puttygen]. (The guide is accurate whether you’re choosing DigitalOcean as a provider or not.)

Now that you’ve got a key, back it up and put the challenge phrase in your password manager. Once you’ve done that, we’re finally ready to spin up a VM.

## Spinning up a VM

We’ll briefly walk through the exact steps to set up a VM on DigitalOcean, because this part really isn’t hard. And if you decided to use Linode or some other provider instead, you shouldn’t have much of a challenge figuring it out.

Once you’ve browsed to DigitalOcean and logged in (creating a user account first, if necessary), click the big green “Create Droplet” button on the upper right. This provides you with a range of choices of operating system, droplet size, and data center. We will be using Ubuntu 16.04 and a \$5 droplet (offering 1 CPU, 512 MB RAM, 20 GB storage, and 1TB/mo of bandwidth). You should probably select the data center physically nearest you—unless you’re specifically worried about your government, in which case you can pick one overseas. Under “additional options,” I’d recommend Monitoring (which doesn’t cost extra). Under “Add your SSH keys,” if you haven’t already added yours to your account, click “New SSH key,” paste in your *public* key (id\_rsa.pub) from the pair you generated earlier, give it a useful, human-readable friendly name, and click “Add SSH key.” Now make sure that key’s checkbox is ticked on the Create Droplet form (after all, it’s your way into the VM).

Next, choose a hostname for your droplet (something memorable and easy to identify, preferably) and click “Create.” About 15 seconds later, your VPN will be ready to log in, and its IP address will be visible on the main Droplets page. From Linux or a Mac, ssh root@your.new.ip.address. From Windows, enter and save root@your.new.ip.address as a destination, then connect to it, and you’re ready to go. Once you’ve entered in your challenge phrase (if you used one), you’ll be staring at something along the lines of **root@ars-vpn-test:\~\#**.

-   The main Droplets page. See the big green button at the upper right? PUSH THE BUTTON, FRANK.

-   Ubuntu 16.04 is already the default distribution, but make sure you change the Droplet size to \$5/mo. The default, \$20/mo, is more VM than you need for this job.

-   Don’t forget to select an appropriate data center, enable Monitoring if you like (it won’t cost you anything), and add and select your SSH key. Be sure to name the Droplet something helpful, too. You don’t want to be deciphering “ubuntu-512mb-nyc2-01” through “ubuntu-512mb-nyc2-99” at some point later, if you really catch the “roll your own servers” bug.

## Automatic security upgrades

Given that the whole point of this exercise is to *increase* your security, not to screw it up. We want to make sure your new VM gets automatic security upgrades as they become available.

     root@ars-vpn-test:~$ apt update ; apt dist-upgrade -y
     root@ars-vpn-test:~$ apt install unattended-upgrades
     root@ars-vpn-test:~$ dpkg-reconfigure unattended-upgrades

What we did here, in order, was to update ourselves with a fresh list of what’s available in package repositories, then upgrade everything *already* installed to the newest version, then install the *unattended-upgrades* package, and, finally, reconfigure that package. Speaking of which, you’ll be looking at an ncurses text-mode dialog right now asking you to do just that; all you need to do is make sure **\<Yes\>** is highlighted in red (it should be by default), then hit enter twice (once to accept that you want to turn on automatic upgrades and the second to accept the default pattern for automatically installed upgrades, which boils down to “security related stuff only, not new shiny features”).

Page: [1] 2 [3][2] [4][3] [5][4] [Next →][2]

#### Gear & Gadgets —

## While not perfect, either, cloud hosting providers have a better customer data record.

![[Enlarge][5] / The first step to improved security is making sure it *stays* improved.]

## Installing and configuring OpenVPN server

OK, now it’s time for the chewy part. The packages you’ll need are **openvpn** and **easy-rsa**.

     root@ars-vpn-test:~$ apt install openvpn easy-rsa

Seriously, that was all there was to the *installation,* but now it’s time to start configuring. First of all, we need to enable ipv4 packet forwarding:

     root@ars-vpn-test:~$ nano /etc/sysctl.conf

All you need to do in here is find the line that says **\#net.ipv4.ip\_forward = 1** and remove the leading pound sign (“hashtag”, for you young’uns). This uncomments the line, enabling it to take effect. Press ctrl-X to exit and Y to say Yes, you’d like to save it, and you’re back at the command prompt again.

     root@ars-vpn-test:~$ sysctl -p

The system will inform you that you’ve set the value **net.ipv4.ip\_forward = 1**. Congratulations, you’re ready to route. Next step is getting the helpful scripts from the **easy-rsa** package in place and using them to generate your own private Certificate Authority.

     root@ars-vpn-test:~$ cp -a /usr/share/easy-rsa/* /etc/openvpn/
     root@ars-vpn-test:~$ cd /etc/openvpn
     root@ars-vpn-test:/etc/openvpn$ nano vars

The **/etc/openvpn/vars** file contains three really important settings - **KEY\_SIZE**, which controls just what it sounds like and should be set to a *minimum* of 2048 (I use 4096); and **CA\_EXPIRE** and **KEY\_EXPIRE**, which control how long your keys are good for, with a default 10-year expiration date. Expired keys don’t work anymore, so this is basically a drop-dead date for your VPN configuration. After these dates come and go, you’ll have to regenerate and re-distribute your keys again.

You should generally change the rest of the values—**KEY\_COUNTRY**, **KEY\_PROVINCE**, and so forth—to match what makes sense for you, but these are basically human-readable fluff, and the computer doesn’t particularly care what’s in there. Anything, including the default values, will work.

Once you’ve CTRL-X’ed and Y’ed your way out of **vars** and saved it, it’s time to get back to work at the shell.

     root@ars-vpn-test:/etc/openvpn$ source ./vars
     root@ars-vpn-test:/etc/openvpn$ ./clean-all

You’ll get some dire warnings about deleting all your keys here—ignore it. Running a preparatory ./clean-all is a **mandatory** step on modern OpenVPN installations. Just don’t run it *again* unless you want to lose all your keys and certificates.

     root@ars-vpn-test:/etc/openvpn$ ./build-ca
     root@ars-vpn-test:/etc/openvpn$ ./build-key-server server

There will be quite a lot of pressing \[enter\] through these steps to confirm the default values you set in **vars** earlier. You can just enter your way through, but be sure to actually press Y twice at the end to first sign the certificate, then commit it. Our next step will be building the Diffie-Hellman key, with the **./build-dh** command. You need to specify a keysize argument on the command line for this one. More is generally better, so I went with a 4096 bit key… which took quite a while to generate; 26 minutes and 35 seconds, to be exact. Once you get this process started, you might want to go watch a TV show or something. It *will* be a while.

     root@ars-vpn-test:/etc/openvpn$ ./build-dh 4096

Now you’re ready to create your actual certificates and keys. Remember how many times you had to press \[enter\] when you created your CA certificate and your server key a couple of steps above? If you found that annoying, you might want to do some purely optional prep work here. The **build-key** and **build-key-pass** tools are both human-readable scripts that invoke **pkitool.** Both of them can be edited to remove the **–interact** argument that they pass it by default, which results in that obnoxious ten-in-a-row \[enter\] sequence. Instead of editing that line directly (and maybe screwing it up and not knowing how to get it back to the original), copy the line, paste it into a new one, then comment out the first line with a pound sign. Once that’s done, remove the **–interact** argument in the second line you pasted in. For **build-key**, you should wind up with this:

     #!/bin/sh
     
     # Make a certificate/private key pair using a locally generated
     # root certificate.
     
     export EASY_RSA="${EASY_RSA:-.}"
     #"$EASY_RSA/pkitool" --interact $*
     "$EASY_RSA/pkitool" $*

… and for **build-key-pass**, you’ll wind up with this:

     #!/bin/sh
     
     # Similar to build-key, but protect the private key
     # with a password.
     
     export EASY_RSA="${EASY_RSA:-.}"
     #"$EASY_RSA/pkitool" --interact --pass $*
     "$EASY_RSA/pkitool" --pass $*

Once you’ve edited and saved both of these (or ignored this step, if you don’t mind wearing the paint off your Enter key), you’re ready to actually generate some keys and certificates to authenticate with. I generated three keypairs—**client-no-pass**, **client-with-pass**, and **R8000**—the latter being intended for use with my handy-dandy Netgear router with DD-WRT firmware.

     root@ars-vpn-test:/etc/openvpn$ ./build-key R8000
     root@ars-vpn-test:/etc/openvpn$ ./build-key client-no-pass
     root@ars-vpn-test:/etc/openvpn$ ./build-key-pass client-with-pass

Much like when we generated an SSH keypair earlier, the difference between keys generated with **build-key** and **build-key-pass** is that the first work “naked,” but the second will require a challenge phrase to be entered in when the OpenVPN tunnel is started each time. In general, keypairs with a challenge are more appropriate for credentials you’ll use directly at your computer or phone and start and stop manually, while keypairs *without* a challenge phrase are more appropriate for unattended use in which devices might automatically start and stop tunnels without user intervention. (DD-WRT can actually use keypairs with challenge phrases, but in doing so it subverts most of the point: you have to save the challenge phrase *in* the configs; so presumably an attacker that got hold of the keypair would be able to get hold of the challenge phrase just as easily.)

Now that you’ve got your credentials generated, it’s time to configure the server itself. First, let’s grab a reference copy of a typical-ish OpenVPN server config from where the packages left it:

     root@ars-vpn-test:/etc/openvpn$ cp /usr/share/doc/openvpn/examples/sample-config-files/server.conf.gz /etc/openvpn/
     root@ars-vpn-test:/etc/openvpn$ gunzip ./server.conf.gz
     root@ars-vpn-test:/etc/openvpn$ mv server.conf server.conf.dist

It can be pretty overwhelming wading through the mass of comments in that default config file, so we’re going to rename it something safe—**server.conf.*dist***, so that the system won’t try to execute it—and just start over with a clean file. That will look like this:

     # /etc/openvpn/server.conf - Ars Technica Edition
     port 1194
     proto udp
     dev tun
     
     ca /etc/openvpn/keys/ca.crt
     cert /etc/openvpn/keys/server.crt
     key /etc/openvpn/keys/server.key # This file should be kept secret
     dh /etc/openvpn/keys/dh4096.pem
     
     cipher AES-256-CBC
     auth SHA512
     
     server 10.8.0.0 255.255.255.0
     push "redirect-gateway def1 bypass-dhcp"
     push "dhcp-option DNS 8.8.8.8"
     push "dhcp-option DNS 8.8.4.4"
     
     ifconfig-pool-persist ipp.txt
     keepalive 10 120
     
     comp-lzo
     
     persist-key
     persist-tun
     
     status openvpn-status.log
     verb 3

The settings **port 1194**, **proto udp**, and **dev tun** set us on the IANA reserved port for OpenVPN, using the UDP protocol (highly recommended; OpenVPN can use TCP, but your performance will suffer *significantly* for it if you do) and the **tun** style of virtual network adapter rather than **tap**. The differences between tun and tap are fairly arcane, but at the end of the day **tun** both provides more security for individual client devices from other client devices and, in my experience, it’s also less likely to crash for no apparent reason, so **tun** it is.

The next block of four settings should be pretty self-explanatory, pointing OpenVPN to the location of the credentials it needs to run. It gets more interesting with **cipher** and **auth.** These are the cipher used to encrypt your data and the digest used to handle authentication, respectively. The options I’ve chosen here are err on the paranoid side, which won’t hurt your performance any on your own computer or at the VM you’re running the server on (even my Celeron J1900 Homebrew can push \>200 Mbps with these settings), but it may be a bit much for a consumer router if you’re setting up a router-based network-wide VPN tunnel like we will be.

If you’re interested in twiddling the performance-vs-security slider, I’ve got your back: my Netgear R8000 test router managed about 25 Mbps throughput configured with **AES-256-CBC/SHA512** as shown here. **AES-256-CBC/SHA1,** which is still reasonably secure, got a more respectable 37.24 Mbps. That’s about as far down as you can go and still call the result “a VPN” with a straight face, though. If you want better performance than that, you should probably consider either running the VPN client directly on your computer itself or on a more powerful router.

-   This is pretty representative of the Netgear R8000’s throughput on my most paranoid OpenVPN settings. Technically, this is \*double\* VPN’ed—the Nighthawk built its tunnel \*through\* the tunnel the Homebrew is already running upstream of it. However, the real constraint here (on the download side, at least) is the R8000’s own performance—it can’t hit anywhere near the nominal 100 Mbps provided by Spectrum or even whatever’s left of that after the Netflix streaming and whatever else my wife, kids, and my other computers were doing while the tests ran.

-   This is a speedtest.net run on the Homebrew, powered by a Celeron J1900, using the nice-and-paranoid combination of AES-256-CBC/SHA512. The results you’re seeing—80 Mbps down and 5-8 Mbps up—are the limits of my Internet connection and/or the stuff my wife, kids, and various computers were doing while I ran the test. When not constrained by the actual network connection, the Homebrew will push \> 200 Mbps of OpenVPN traffic.

Moving on, **server 10.8.0.0 255.255.255.0** defines the IP address range used by the server and its clients. As configured, the server itself will occupy 10.8.0.1 (and several more addresses), and each client will have its own address. Actually, since we’re using the **tun** adapter, each client will use *four* IP addresses in its own [/30 subnet]—up to 10.8.0.255. This means we’ll be limited to about 60 total clients, so if you’re setting this VPN up for your friends and your friends’ friends and maybe some people you don’t even really like all that much, you may need to consider a bigger subnet.

The next line, **push “redirect-gateway def1 bypass-dhcp”**, is optional but recommended for our purposes. It instructs any connecting client to route all of its traffic across the VPN, ignoring any settings it might have to the contrary from its local DHCP server. It’s also possible to set this directly in the *client* configuration, which we’ll cover next. The **push “dhcp-option DNS”** lines tell OpenVPN to force the client to use Google’s multicast DNS servers instead of whatever it was using previously, which might have been an ISP-controlled DNS server or servers. If you don’t like Google either, you can choose Level 3’s DNS servers at 4.2.2.4 and 4.2.2.2, or OpenDNS at 208.67.222.222 and 208.67.220.220. (Warning: although they do it “for good reasons,” OpenDNS edits the results returned from DNS lookups done against their servers. *Caveat Emptor*.)

The **ifconfig-pool-persist** directive has OpenVPN keep track of what tunnel IP addresses it has handed out to which clients in the past and try to maintain some consistency as it hands out new ones in the future. The **keepalive** directive sends pings down the tunnel and restarts it if they don’t get back within a certain amount of time. The **comp-lzo** directive uses LZO compression on the tunnel’s contents, which is typically a win. Much of what you send won’t be further compressible, but **LZO** is so cheap as to be nearly free in terms of CPU time, so I prefer to use it when possible. The **persist-key** and **persist-tun** directives try to reuse existing pieces of the setup wherever possible when restarting the tunnel, **status** keeps a log file, and **verb** sets how verbose the logging is.

If you change any of these settings from what they’re shown here, make a note of it. You’ll need to make the same changes on your client configs later. Aside from that, you’re ready to start your OpenVPN server for the first time!

     root@ars-vpn-test:/etc/openvpn$ systemctl enable openvpn
     root@ars-vpn-test:/etc/openvpn$ systemctl start openvpn

Now check to make sure it’s actually running:

     root@ars-vpn-test:/etc/openvpn$ ps wwaux | grep vpn | grep -v grep

This should return a process ID and a command mutex for OpenVPN, like this:

     root@ars-vpn-test:/etc/openvpn# ps wwaux | grep vpn | grep -v grep
     root 5493 0.0 1.1 35792 5576 ? Ss 18:01 0:01 /usr/sbin/openvpn --daemon ovpn-server --status 
     /run/openvpn/server.status 10 --cd /etc/openvpn --script-security 2 --config /etc/openvpn/server.conf
     --writepid /run/openvpn/server.pid

If you get no output at all from this command, you might try starting the openvpn server in interactive mode to see if its output helps you troubleshoot. If you never get to “Initialization Sequence Completed,” you’ve got a problem you’ll need to resolve before moving on.

Page: [1][] [2] 3 [4][3] [5][4] [Next →][3]

#### Gear & Gadgets —

## While not perfect, either, cloud hosting providers have a better customer data record.

## Client credentials and configs

For each client you want to connect, you need three credential files: the Certificate Authority cert (this is the same for all clients) at **/etc/openvpn/keys/ca.crt**, the client cert at **/etc/openvpn/keys/clientname.crt**, and the client’s private key at **/etc/openvpn/keys/clientname.key**. (If you want to be sure that even an attacker who gets root on your server can’t connect to the server later using your own VPN infrastructure, you can delete the **clientname.key** from the server once you have it safely available on the client.)

If you’re on Linux or Mac, you can use the **scp** tool to grab these files:

     you@linuxormac:~$ scp root@yourserver:/etc/openvpn/keys/ca.crt ./
     you@linuxormac:~$ scp root@yourserver:/etc/openvpn/keys/clientname.crt ./
     you@linuxormac:~$ scp root@yourserver:/etc/openvpn/keys/clientname.key ./

If you’re a Windows user, it’s usually easiest to just **cat /etc/openvpn/keys/ca.crt** inside your PuTTY window, then highlight the text with your mouse. It’s automatically copied into the clipboard just from highlighting it; you don’t need to Ctrl-C or anything. From there, you can open up a Notepad instance, paste into there, then Save As ca.crt (be sure to change the file type to “All Files” first so Windows doesn’t “helpfully” stick a .txt on the end of it). Do the same for the other two files as well.

Now, you’ll need to install OpenVPN—**sudo apt install openvpn** on an Ubuntu machine. On a Mac, you can either use Homebrew to install a command-line version and treat it like Linux, or you can download and install [Tunnelblick] (which you’re on your own configuring). On Windows, you’ll need to [download and install OpenVPN] from its website. On Linux or (non-Tunnelblick) Mac, you’ll need to move the files to **/etc/openvpn/keys** (which you may need to create if it doesn’t already exist). On Windows, they need to go in **C:\\Program Files\\OpenVPN\\config\\keys** (the config directory will be there already, but you’ll need to create the keys directory).

Next, you’re ready to create the last piece of the puzzle: your OpenVPN *client* configuration file, which we will cleverly name **clientname.conf** on a Linux or Mac machine, or **clientname.ovpn** on a Windows machine (again being careful to avoid accidentally getting an extra **.txt** stuck on the end). This goes in **/etc/openvpn/clientname.conf** on Linux or (non-Tunnelblick) Mac or in **C:\\Program Files\\OpenVPN\\config\\clientname.conf** (again, be sure to avoid the tricky .txt Notepad will try to stick on the end) on Windows.

     # OpenVPN clientname.conf - Ars Technica Edition
     ca keys/ca.crt
     cert keys/clientname.crt
     key keys/clientname.key
     
     remote your.server.ip.address 1194
     comp-lzo
     client
     dev tun
     redirect-gateway def1
     
     remote-cert-tls server
     cipher AES-256-CBC
     auth SHA512
     
     proto udp
     resolv-retry infinite
     nobind
     
     # Try to preserve some state across restarts.
     persist-key
     persist-tun
     
     # Set log file verbosity.
     verb 3
     mute 20

We’re not going to go through this one line by line, since it mostly just matches the server config file we already looked at. However, be sure that if you changed anything in the server config from our template here, you also change it to match in the client—particularly the **comp-lzo**, **cipher**, **proto**, and **auth** directives. The **redirect-gateway def1** option isn’t strictly necessary if you left the matching option in the server’s config file. It does the same thing here, and specified in either location it will have the same effect. It doesn’t hurt to have it on both ends for a sort of belt-and-suspenders that assures you you’re redirecting all your traffic down the tunnel no matter which config you decide to look at, though.

Once you’ve got this file in place and ready to go, you can fire up your VPN manually—**openvpn /etc/openvpn/clientname.conf** on Ubuntu or (non-Tunnelblick) Mac; or right-click the .ovpn file and select **Start OpenVPN on this config file** under Windows. (Windows also installed an OpenVPN GUI icon in your system tray, which you can interact with there if you like.) If it connects and gets all the way to “Initialization Sequence Completed,” you should be good to go. Test that your traffic goes through by doing **traceroute -n 8.8.8.8** on Linux or Mac (you may need to install the **traceroute** package first) or **tracert -d 8.8.8.8** on Windows, making sure the route goes through your VPN IP addresses.

Once you’re satisfied that your VPN is up and working properly, if you’d like to make it an everyday thing, enable it as a service. On Ubuntu, **systemctl enable openvpn ; systemctl start openvpn** will do the trick. On Windows, go into the Services applet from the Control Panel, set the OpenVPN Service to “automatic”, then start it. On a Mac using Homebrew, [set up a LaunchDaemon], or if using TunnelBlick, [set it to connect automatically].

## Um… now Netflix won’t work.

Yeah, that’s a problem you’re going to have. Netflix is under some pretty odious obligations to region-lock a lot of their content, since they’re only licensed to show some UK content to UK users, US content to US users, and so forth. The content providers *do* complain if they perceive that their region locks aren’t being honored (as do Netflix’s *competitors* in other regions, such as SKY). As a result, Netflix tends to block known data centers, proxy servers, and vpn providers as much as possible.

If you’re running your OpenVPN client directly on your computer, you’ll likely have to drop the VPN connection whenever you want to use Netflix (or other media service that blocks your data center). Luckily, if you want to run your OpenVPN directly on the router that your whole network goes through, you’ve got a better option: policy-based routing.

## OpenVPN on a Homebrew router

If you’re running [a Homebrew router] like mine, getting the whole network behind your new VPN is almost embarrassingly easy. Following the Ubuntu instructions above, you just **apt update ; apt install openvpn**, put the ***clientname*.conf** in **/etc/openvpn** and the **ca.crt**, ***clientname*.key** and ***clientname*.crt** in **/etc/openvpn/keys**, **systemctl enable openvpn ; systemctl start openvpn** and poof, you’re connected. The only thing left to do after that is to allow forwarding with masquerade across the VPN tunnel as well as across the WAN, in **/etc/network/if-pre-up.d/firewall**.

You can find a full set of sample configs for a Homebrew router (including dhcpd, bind9, firewall, openvpn, and more configs) at my [Github repository], and it would probably be a good idea to reference them there if you really want to do it for yourself. We really only added two lines to our firewall: **VPNOUT=tun0** to define an interface for our outbound VPN connection and **-A POSTROUTING -o \$VPNOUT -j MASQUERADE** to allow outbound, NATted traffic through the tunnel.

Once through that, everything seemed to work swimmingly on my own home network… until I got a plaintive cry from upstairs. My daughter Jane stumbled on the same problem we mentioned above, “Daddy, do you know why Netflix says we’re using a blocker?” Oops.

As such, the next task for my Homebrew router was *policy-based routing.* I needed to tell it *not* to send any traffic from my Rokus through the tunnel, instead allowing them direct access through the WAN interface. The first step was finding their MAC addresses (visible from their Network Settings screens) and using these to add host definitions to my Homebrew’s **/etc/dhcp/dhcpd.conf** file:

     subnet 192.168.0.0 netmask 255.255.255.0 {
     range 192.168.0.100 192.168.0.199;
     option routers 192.168.0.1;
     option domain-name-servers 192.168.0.1;
     option broadcast-address 192.168.0.255;
     }
     
     host Downstairs-Roku {
     hardware ethernet B0:A7:1A:97:3D:5E;
     fixed-address 192.168.0.50;
     }
     
     host Upstairs-Roku {
     hardware ethernet b8:3e:4e:d4:5b:62;
     fixed-address 192.168.0.51;
     }

Once **/etc/dhcp/dhcpd.conf** was reconfigured to add the host leases, **systemctl restart isc-dhcp-server** got them applied. At the Rokus themselves, at the same Settings -\> Network Settings screen I’d gotten their MAC addresses from, a simple “Update network settings” released and renewed their DHCP leases and then I was ready to turn them into special, non-VPN’ed snowflakes. All this required was adding three quick lines to the WAN interface settings in **/etc/network/interfaces**:

     # This file describes the network interfaces available on your system
     # and how to activate them. For more information, see interfaces(5).
     
     source /etc/network/interfaces.d/*
     
     # The loopback network interface
     auto lo
     iface lo inet loopback
     
     # the LAN interface
     auto enp2s0
     iface enp2s0 inet static
     address 192.168.0.1
     netmask 255.255.255.0
     dns-nameservers 8.8.8.8 8.8.4.4
     
     # The WAN interface
     auto enp1s0
     iface enp1s0 inet dhcp 
     # Rokus on .50 and .51 need their traffic to bypass
     # the outbound VPN, so that Netflix won't block it.
     #
     # we accomplish that by adding its traffic to a 
     # route table that we're implicitly creating here
     # by referencing it with a number.
     #
     post-up ip rule add from 192.168.0.50 lookup 100
     post-up ip rule add from 192.168.0.51 lookup 100
     post-up ip route add default dev enp1s0 table 100

Those last three lines—the post-up ip rule and post-up ip route directives—are the only things that actually changed from the original config I was using. The settings in **/etc/network/interfaces** don’t actually take effect until after a reboot, so I jumped the gun a bit by running them directly at the command line (just as they’re shown in the config file, only without the “post-up” bit at the start). Presto, the Rokus work again; Netflix no longer accuses me of using “an unblocker,” which means no more plaintive daughter calling downstairs.

At this point, the entire house is getting its traffic routed safely out from under the ISP’s nose to an endpoint at Digital Ocean—except for the Rokus, of course, which are happily going out directly through my residential ISP where Netflix won’t complain about them. It has actually been running this way for several days now. When I told my wife last night that all her stuff was going out through a VPN, her only response was to blink at me and say “Huh.”

Page: [1][5] [2][6] [3][7] 4 [5][8] [Next →][8]

#### Gear & Gadgets —

## While not perfect, either, cloud hosting providers have a better customer data record.

![[Enlarge][9] / This is a speedtest.net run on the Homebrew, powered by a Celeron J1900, using the nice-and-paranoid combination of AES-256-CBC/SHA512. The results you’re seeing—80 Mbps down and 5-8 Mbps up—are the limits of my Internet connection and/or the stuff my wife, kids, and various computers were doing while I ran the test. When not constrained by the actual network connection, the Homebrew will push \> 200 Mbps of OpenVPN traffic.]

## OpenVPN on a (Netgear) consumer router

You can also run OpenVPN on all sorts of consumer routers, running either OpenWRT or DD-WRT. I’m going to just talk very specifically about getting it running on a Netgear Nighthawk here for good reason: Netgear directly runs [myopenrouter.com], where they actually *collaborate* with open source developers who are adapting builds of open source firmware for installation on Netgear routers. This is extremely cool, not least because it means that you can install firmware from myopenrouter directly onto a supported Netgear router *using the router’s own Web-based interface*.

It’s certainly possible to install DD-WRT or OpenWRT on a non-Netgear consumer router, but it’s generally a giant pain in the ass and a good way to potentially brick your router. Typically, the vendor doesn’t support it, doesn’t *want* you to do it, and you have to put the router into a TFTP firmware flash mode and/or use some sort of stack-smashing hack to break out of the OEM firmware in the first place. Thousands of people do exactly that, of course. A disturbing number of them brick a few routers along the way, though, so the heck with that: Netgear is actually *supporting* open source, so here’s me supporting them right back.

![[Enlarge][10] / It’s a facehugger. It’s a router. It’s a Nighthawk! ¶ Jim Salter]

I had a Netgear Nighthawk X6 on hand already (the very same one I used in [the first Homebrew router article]). I fired it up, browsed to [myopenrouter.com], and logged in. (You do need to create a free-as-in-beer account before you can download any of the firmware from the site.) From there, I clicked Downloads, changed the Search Downloads combo box to “R8000” (the internal, non-market-y codename of my Nighthawk X6), and downloaded the latest “DD-WRT Kong Mod” for the router. That was a ZIP file, which I extracted into my Downloads directory. With that done, I logged into the Nighthawk’s Web interface and went to Advanced -\> Security -\> Router Update, browsed to the .CHK file I’d extracted from the ZIP, and that was that. (You might get a warning that the firmware you’ve selected is older than your current firmware, but that’s just a “misfeature.” It compares version numbers, but the version number history for Kong’s DD-WRT mods is completely separate from the version number history for Netgear’s OEM firmware.)

That’s really all there is to installing Kong’s DD-WRT build on a Nighthawk; after ignoring the version number mismatch, it installs and reboots the router automagically in just a minute or two, and you’re ready to rock, with the router on 192.168.1.1 and handing out addresses in the 192.168.1.0/24 range on your LAN. The first thing you’ll notice after grabbing an IP address, browsing to http://192.168.1.1, and logging back into your newly DD-WRT’ed Nighthawk is that it tells you that you have to change your username and password, which are currently insecure default. Do that, and I would suggest you pick the username “root.” I’m not sure it actually pays attention to the username field here, even though you’re allowed to change it.

You should already be set up reasonably well for most residential or small business Internet connections at this point, with a local subnet of 192.168.1.0/24, DHCP running on the WAN, and dnsmasq providing DHCP for the LAN. One thing you absolutely **need** to change, though, is the DNS setting in the “home page” of DD-WRT’s interface. By default it’s 0.0.0.0 in all three blocks and will be filled by the ISP’s settings pushed to you via DHCP. You do **not** want that, since our whole point here is camouflaging things from your ISP. So instead, set them to 8.8.8.8, 8.8.4.4, and 4.2.2.4 (Google, Google, and Layer3 anycast DNS server addresses). If you leave any of them blank, they will get filled with your ISP’s servers, defeating most of our purpose.

![[Enlarge][11] / Note that the DNS settings are COMPLETELY filled in here. If you leave one of the three blanks at 0.0.0.0, it will be overwritten by one of your ISP’s DNS servers, potentially leaking information to them (or opening up vulnerabilities for manipulation) that you don’t want.]

Setting up the VPN itself is pretty easy if you know what you’re doing. Navigate to Services, then VPN, and look for “Client.” Tick the radio box to enable Client and then the one that opens up the “Advanced” options for the client. Find your ca.crt, and the client .crt and .key (in my case, I generated R8000.crt and R8000.key earlier), and paste them into the appropriate boxes. Set “Encryption Cipher” to AES-256-CBC and “Hash Algorithm” to SHA512 (or whatever you set them to in your OpenVPN server’s config file), set NAT to “enabled,” and check the box for “nsCertType verification.”

Finally, to avoid the dreaded Netflix problem, we take advantage of DD-WRT’s built-in policy-based routing feature. This is considerably wimpier than the one I used under Ubuntu for the Homebrew, but it’s much, *much* easier than getting the job done from DD-WRT’s command line. (You can shell into DD-WRT with SSH, if you need to and if you enable that option. That’s… kinda cowboy, though, so since we *can* avoid it, we’re *going* to.)

![The DD-WRT VPN dialog, with most of the things you’ll need to change from default values highlighted. Note that the actual CA certificate and client certificate and key aren’t shown here—they’re just off the bottom of the screen, with the “Save” and “Apply” buttons underneath them a little further.]

Under DD-WRT, any address or subnet you enter into the “policy-based routing” text box will be *routed* through the VPN, not excluded from it. You do need to be careful, though. If you get frisky and put the wrong thing in here—like 192.168.1.0/24, the entire local subnet—you can pretty easily lock your router up tighter than a drum. If you do that, it’s not going to talk to you again until it has been rebooted… and won’t talk to you *then*, either, if it manages to reconnect its VPN. So if you’ve managed to lock it up this way, you’ll want to unplug its WAN cable, *then* reboot it, which will allow you back into the interface to fix your screw-up. Dire warnings done, what you’ll want to enter in here are three single lines: 192.168.1.64/26, 192.168.1.128/26, and 192.168.1/192/26. These add up to mean that anything from 192.168.1.64-192.168.1.254 will get routed out through your VPN, leaving anything from 192.168.1.1 (the router, which *must* be allowed direct access) through 192.168.1.63 able to just hit the ’Net directly.

That’s it. Scroll down to the bottom of the page, click Save first, then click Apply. Your VPN connection will fire up and should finish connecting in about 10 to 20 seconds. You can then check on it under Status -\> OpenVPN—once it hits “Initialization Sequence Completed,” all is well.

![[Enlarge][12] / You get lots of chewy dialog here when the VPN client attempts to connect to the server. The money line here is “Initialization Sequence Completed.” If you see that, all is almost certainly well. If you don’t, something absolutely is not, and you’ll need to chase the problem down.]

Finally, you may need to set some static leases for your media center devices. My Rokus don’t allow static configuration within themselves as an option, so doing it on the router is a necessity. Hit the Services tab; under the “Services” sub-tab (the “home screen” of Services, where you should already be), you’ll see a section for adding static leases, under “DHCP Server.” The UI here is a little funky: clicking the “Add” button makes a new blank row show up; it doesn’t add something you’ve already entered in. Now that you’ve got a blank row, put the MAC address of your Roku or other dumb, needs-to-get-directly-to-the-Internet device in, specify an IP address for it that’s below .63… and *don’t* hit Add again. Instead, scroll all the way to the bottom of the page, where you’ll find buttons to click to first Save, then Apply.

![[Enlarge][13] / In the policy-based routing section, we told DD-WRT to send clients at 192.168.1.64/26, 192.168.1.128/26, and 192.168.1.192/26 through the VPN instead of directly out to the Internet. Staticking my test server monolith here at 192.168.1.10—within that 0-63 range we didn’t cover in the policy routes—means that monolith won’t use the VPN at all. In the real world, you’d use this for Rokus or other media client devices that need to avoid Netflix/Hulu/SKY/whatever anti-VPN restrictions.]

Most of the steps above will be the same (or at least very similar) for *any* consumer router you’ve managed to shoehorn DD-WRT (or a DD-WRT variant, like Tomato) onto.

## On consumer routers, price, and performance

If you’re considering buying a consumer router specifically for running a VPN out of your network, the R8000 might or might not be the best fit for you. I’m going to stick to recommending Netgear Nighthawks no matter what for two reasons: Netgear actually *supports* the process of you replacing their OEM firmware with DD-WRT builds, and Netgear uses relatively high-powered ARM A9 multi-core CPUs in their Nighthawk series, where many consumer routers are using much, much weaker MIPS CPUs. This makes a *huge* impact on VPN throughput.

The lowest-powered choice in this line is the Netgear R6400, but that model has a slightly slower CPU than the one in the R8000 I tested here (which could handle 25 Mbps throughput on AES-256-CBC/SHA512 and 35+ Mbps on AES-256-CBC/SHA1). The R8000 uses a 1 GHz ARM A9 CPU, where the R6400 uses an 800MHz ARM A9. I haven’t directly tested it, but I would assume you’re looking at roughly 80 percent of the performance of the higher-end part, maybe less. I don’t recommend the R6400 currently even if you can live with the performance drop, because the **R6700** is the same price on Amazon (\$110) and features the higher-performance 1 GHz CPU—the exact same part as the R8000 I tested here.

The R6700 and the R8000 share the same CPU and will perform equivalently for VPNs, but the R8000 is a tri-band router while the R6700 is only dual-band. Is the addition of a second 5GHz radio worth the additional \$150, with the R8000 currently running \$260 on Amazon? That depends on how many Wi-Fi devices you have in the house. If you’ve got a couple of TVs, several phones, a couple of laptops, and a tablet or two with several people who might be using a bunch of them simultaneously, the answer is probably a resounding “yes.” On the other hand, if you’ve got a high-quality [mesh network kit] like Orbi or Plume handling Wi-Fi duties, you don’t need the R8000’s radios *at all*, so you can get the R6700 to handle routing and VPN duties and let your mesh kit keep handling the Wi-Fi. (And before you ask, no, you can’t just run DD-WRT on the mesh kit itself.)

![[Enlarge][14] / The Nighthawk R9000 offers twice the VPN throughput of the R6700… but at \$450, it does so at just over four times the cost. (And our Homebrew still smacks its butt and sends it running home to mommy.)]

Finally, if the sky’s the limit, Netgear also offers a Nighthawk X10 (R9000) with a whopping 1.7 GHz *quad*-core ARM A9 CPU. I have not tested one yet, but if I had to hazard a guess, I’d expect nearly double the OpenVPN throughput that the R8000’s 1 GHz dual-core ARM A9 managed (figure an estimated 45+ Mbps throughput on AES-256-CBC/SHA512, or 65+ Mbps on AES-256-CBC/SHA1). You’ll also get MU-MIMO, quad-stream 2.4 GHz and 5 GHz radios, and where the R8000 had a second 5 GHz radio, the R9000 has an 802.11ad 60 GHz “wigig” radio instead. (You almost certainly don’t have a wigig *client* device to connect to it with, but hey, you’ll have the radio on your router.) All of this comes at a pretty whopping price tag, though: Amazon is currently listing the R9000 at \$450.

## On (in)security and performance

A final option, which I will go ahead and discuss but flat-out tell you **we do not recommend** is to sacrifice security for performance almost entirely. Weakening the encryption protocol and dropping the authentication protocol entirely—AES-128-CBC/None—resulted in 51.25 Mbps throughput on my R8000. Finally, dropping both authentication *and* encryption (at which point, yes, you’ve *tunneled* your data but somebody who actually cared could still pick it apart) to None/None will go wire speed on just about any Internet connection you throw it at.

File this under “I’d rather talk with you kids about it than have you learn it on the playground.” Yes, these options are faster. And if all you’re concerned about—we truly mean *all* you’re concerned about—is throwing a monkey wrench into your ISP’s very casual predatory snooping, they’ll *probably* do the trick. An actual attacker will absolutely be able to unravel these “fast” tunnels and view or modify the data running down them, though, so really… *don’t* do it. Or, at the very least, don’t claim nobody told you it was a bad idea.

## Conclusions

It’s really *not* that hard to roll your own, personally hosted VPN service to get your data away from prying eyes at your ISP (or at the coffee shop; we didn’t cover the minutiae of installation here, but you can use OpenVPN credentials on Android and iOS phones and tablets, too). *Extremely* heavy data users might have problems with bandwidth overage costs from their VPS provider, but the 1TB/month allotment from DigitalOcean will easily cover my household usage. Whether you want to set the whole thing up on a router to blanket-cover your whole network, on individual devices, or both at once, you can get it done.

### The Good:

-   OpenVPN can be configured extremely securely, is free as in speech and as in beer, and can be run on just about any device you can think of: Windows, Macs, Linux or BSD machines, phones, tablets, and even (some) consumer routers.

### The Bad:

-   At the end of the day, your insecure traffic is still *insecure—*you’ve just moved your point of vulnerability, not eliminated it. You (understandably) didn’t trust your ISP, so you moved it out of their reach. You (understandably) didn’t trust VPN providers, so you didn’t use them. But you’re still trusting your hosting provider… *and* everybody *they’re* downstream of.

### The Ugly:

-   You now have one more machine to maintain. Your Ubuntu 16.04 LTS VM will automatically apply security upgrades, and it’s supported through April 2021 (after which it will need an upgrade to a newer LTS version, which can generally be done relatively painlessly and in place for simple systems like this), but that’s not forever. There’s no guarantee that some new crypto breakthrough won’t force you to reevaluate your cipher/digest choices before then, either.

Page: [1][15] [2][16] [3][17] [4][18] 5

  [Aurich / Thinkstock]: https://web.archive.org/web/20170528052026im_/https://cdn.arstechnica.net/wp-content/uploads/2017/05/vpn-privacy-800x450.jpg
  [Senate ruling]: https://web.archive.org/web/20170528052026/https://arstechnica.com/information-technology/2017/03/how-isps-can-sell-your-web-history-and-how-to-stop-them/
  [move along, citizen, nothing to see here]: https://web.archive.org/web/20170528052026/https://cei.org/blog/six-reasons-fcc-rules-aren%E2%80%99t-needed-protect-privacy
  [*edits*]: https://web.archive.org/web/20170528052026/https://arstechnica.com/tech-policy/2014/09/why-comcasts-javascript-ad-injections-threaten-security-net-neutrality/
  [inserting *more* ads]: https://web.archive.org/web/20170528052026/https://arstechnica.com/tech-policy/2014/09/meet-the-tech-company-performing-ad-injections-for-big-cable/
  [Lenovo did to unsuspecting users of its consumer laptops]: https://web.archive.org/web/20170528052026/https://arstechnica.com/security/2015/02/lenovo-pcs-ship-with-man-in-the-middle-adware-that-breaks-https-connections/
  [Server Name Indication]: https://web.archive.org/web/20170528052026/https://en.wikipedia.org/wiki/Server_Name_Indication
  [MITM]: https://web.archive.org/web/20170528052026/https://en.wikipedia.org/wiki/Man-in-the-middle_attack
  [has the use of a Certificate Authority to generate their own (valid!) certificates]: https://web.archive.org/web/20170528052026/https://arstechnica.com/security/2016/09/firefox-ready-to-block-certificate-authority-that-threatened-web-security/
  [punycode domain names]: https://web.archive.org/web/20170528052026/https://arstechnica.com/security/2017/04/chrome-firefox-and-opera-users-beware-this-isnt-the-apple-com-you-want/
  [Enlarge]: https://web.archive.org/web/20170528052026/https://cdn.arstechnica.net/wp-content/uploads/2015/06/freewifi.jpg
  [[Enlarge] / If you think this will be secure, please read on.]: https://web.archive.org/web/20170528052026im_/https://cdn.arstechnica.net/wp-content/uploads/2015/06/freewifi-1280x850.jpg
  [when you start looking at VPN providers]: https://web.archive.org/web/20170528052026/https://arstechnica.com/security/2016/06/aiming-for-anonymity-ars-assesses-the-state-of-vpns-in-2016/
  [PDF]: https://web.archive.org/web/20170528052026/https://www.scribd.com/doc/303226103/Fake-bomb-threat-arrest
  [have made good on its no logging claims]: https://web.archive.org/web/20170528052026/https://torrentfreak.com/vpn-providers-no-logging-claims-tested-in-fbi-case-160312/
  [criminal complaint]: https://web.archive.org/web/20170528052026/https://www.unitedstatescourts.org/federal/flsd/480077/1-0.html
  [APT]: https://web.archive.org/web/20170528052026/https://en.wikipedia.org/wiki/Advanced_persistent_threat
  [something else entirely]: https://web.archive.org/web/20170528052026/https://xkcd.com/538/
  [2]: https://web.archive.org/web/20170528062905/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/3/
  [3]: https://web.archive.org/web/20170528062905/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/4/
  [4]: https://web.archive.org/web/20170528062905/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/5/
  [5]: https://web.archive.org/web/20170528072459/https://cdn.arstechnica.net/wp-content/uploads/2017/04/unattended-upgrades-1.png
  [1]: https://web.archive.org/web/20170528062905/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/1/
  [[Enlarge][1] / Actual slide from the Snowden leaks: dramatization of what nation-states do when they come across users not even trying.]: https://web.archive.org/web/20170528062905im_/https://cdn.arstechnica.net/wp-content/uploads/2014/12/happydancensa-1280x964.jpg
  [Download PuTTY]: https://web.archive.org/web/20170528062905/http://www.chiark.greenend.org.uk/~sgtatham/putty/latest.html
  [DigitalOcean’s guide to generating SSH keys with puttygen]: https://web.archive.org/web/20170528062905/https://www.digitalocean.com/community/tutorials/how-to-create-ssh-keys-with-putty-to-connect-to-a-vps
  [[Enlarge][5] / The first step to improved security is making sure it *stays* improved.]: https://web.archive.org/web/20170528072459im_/https://cdn.arstechnica.net/wp-content/uploads/2017/04/unattended-upgrades-1.png
  [/30 subnet]: https://web.archive.org/web/20170528072459/http://www.subnet-calculator.com/cidr.php
  [1]: https://web.archive.org/web/20170528072459/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/1/
  [2]: https://web.archive.org/web/20170528072459/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/2/
  [3]: https://web.archive.org/web/20170528072459/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/4/
  [4]: https://web.archive.org/web/20170528072459/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/5/
  [Tunnelblick]: https://web.archive.org/web/20170528080632/https://tunnelblick.net/
  [download and install OpenVPN]: https://web.archive.org/web/20170528080632/https://openvpn.net/index.php/open-source/downloads.html
  [set up a LaunchDaemon]: https://web.archive.org/web/20170528080632/http://www.aandcp.com/launchdaemons-and-mac-os-x-openvpn-as-an-example
  [set it to connect automatically]: https://web.archive.org/web/20170528080632/https://help.my-private-network.co.uk/support/solutions/articles/6000044022-os-x-tunnelblick-openvpn-auto-start
  [a Homebrew router]: https://web.archive.org/web/20170528080632/https://arstechnica.com/gadgets/2016/04/the-ars-guide-to-building-a-linux-router-from-scratch/
  [Github repository]: https://web.archive.org/web/20170528080632/https://github.com/jimsalterjrs/homebrew-router
  [5]: https://web.archive.org/web/20170528080632/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/1/
  [6]: https://web.archive.org/web/20170528080632/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/2/
  [7]: https://web.archive.org/web/20170528080632/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/3/
  [8]: https://web.archive.org/web/20170528080632/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/5/
  [9]: https://web.archive.org/web/20170528092617/https://cdn.arstechnica.net/wp-content/uploads/2017/04/homebrew-speedtest-2.png
  [[Enlarge][9] / This is a speedtest.net run on the Homebrew, powered by a Celeron J1900, using the nice-and-paranoid combination of AES-256-CBC/SHA512. The results you’re seeing—80 Mbps down and 5-8 Mbps up—are the limits of my Internet connection and/or the stuff my wife, kids, and various computers were doing while I ran the test. When not constrained by the actual network connection, the Homebrew will push \> 200 Mbps of OpenVPN traffic.]: https://web.archive.org/web/20170528092617im_/https://cdn.arstechnica.net/wp-content/uploads/2017/04/homebrew-speedtest-2.png
  [myopenrouter.com]: https://web.archive.org/web/20170528092617/https://www.myopenrouter.com/
  [10]: https://web.archive.org/web/20170528092617/https://cdn.arstechnica.net/wp-content/uploads/2016/09/17-nighthawk-x6.jpg
  [[Enlarge][10] / It’s a facehugger. It’s a router. It’s a Nighthawk! ¶ Jim Salter]: https://web.archive.org/web/20170528092617im_/https://cdn.arstechnica.net/wp-content/uploads/2016/09/17-nighthawk-x6-1280x960.jpg
  [the first Homebrew router article]: https://web.archive.org/web/20170528092617/https://arstechnica.com/gadgets/2016/01/numbers-dont-lie-its-time-to-build-your-own-router/
  [11]: https://web.archive.org/web/20170528092617/https://cdn.arstechnica.net/wp-content/uploads/2017/04/ddwrt-basic-setup.png
  [[Enlarge][11] / Note that the DNS settings are COMPLETELY filled in here. If you leave one of the three blanks at 0.0.0.0, it will be overwritten by one of your ISP’s DNS servers, potentially leaking information to them (or opening up vulnerabilities for manipulation) that you don’t want.]: https://web.archive.org/web/20170528092617im_/https://cdn.arstechnica.net/wp-content/uploads/2017/04/ddwrt-basic-setup.png
  [The DD-WRT VPN dialog, with most of the things you’ll need to change from default values highlighted. Note that the actual CA certificate and client certificate and key aren’t shown here—they’re just off the bottom of the screen, with the “Save” and “Apply” buttons underneath them a little further.]: https://web.archive.org/web/20170528092617im_/https://cdn.arstechnica.net/wp-content/uploads/2017/04/ddwrt-services-vpn.png
  [12]: https://web.archive.org/web/20170528092617/https://cdn.arstechnica.net/wp-content/uploads/2017/04/ddwrt-status-openvpn.png
  [[Enlarge][12] / You get lots of chewy dialog here when the VPN client attempts to connect to the server. The money line here is “Initialization Sequence Completed.” If you see that, all is almost certainly well. If you don’t, something absolutely is not, and you’ll need to chase the problem down.]: https://web.archive.org/web/20170528092617im_/https://cdn.arstechnica.net/wp-content/uploads/2017/04/ddwrt-status-openvpn.png
  [13]: https://web.archive.org/web/20170528092617/https://cdn.arstechnica.net/wp-content/uploads/2017/04/ddwrt-static-lease.png
  [[Enlarge][13] / In the policy-based routing section, we told DD-WRT to send clients at 192.168.1.64/26, 192.168.1.128/26, and 192.168.1.192/26 through the VPN instead of directly out to the Internet. Staticking my test server monolith here at 192.168.1.10—within that 0-63 range we didn’t cover in the policy routes—means that monolith won’t use the VPN at all. In the real world, you’d use this for Rokus or other media client devices that need to avoid Netflix/Hulu/SKY/whatever anti-VPN restrictions.]: https://web.archive.org/web/20170528092617im_/https://cdn.arstechnica.net/wp-content/uploads/2017/04/ddwrt-static-lease.png
  [mesh network kit]: https://web.archive.org/web/20170528092617/https://arstechnica.com/gadgets/2017/04/send-wi-fi-companies-floor-plans-receive-the-ultimate-mesh-networking-test/
  [14]: https://web.archive.org/web/20170528092617/https://cdn.arstechnica.net/wp-content/uploads/2017/04/Amazon-R9000.jpg
  [[Enlarge][14] / The Nighthawk R9000 offers twice the VPN throughput of the R6700… but at \$450, it does so at just over four times the cost. (And our Homebrew still smacks its butt and sends it running home to mommy.)]: https://web.archive.org/web/20170528092617im_/https://cdn.arstechnica.net/wp-content/uploads/2017/04/Amazon-R9000-1280x875.jpg
  [15]: https://web.archive.org/web/20170528092617/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/1/
  [16]: https://web.archive.org/web/20170528092617/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/2/
  [17]: https://web.archive.org/web/20170528092617/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/3/
  [18]: https://web.archive.org/web/20170528092617/https://arstechnica.com/gadgets/2017/05/how-to-build-your-own-vpn-if-youre-rightfully-wary-of-commercial-options/4/
