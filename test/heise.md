# 1Password für Mac generiert Einmal-Passwörter

![1Password scannt auch QR-Codes. ¶ (Bild: Hersteller)]

**Das in der iOS-Version bereits enthaltene TOTP-Feature ist nun auch für OS X 10.10 verfügbar. Zudem gibt es neue Zusatzfelder in der Datenbank und weitere Verbesserungen.**

[AgileBits hat Version 5.3 seines bekannten Passwortmanagers 1Password für OS X freigegeben.] Mit dem Update wird eine praktische Funktion nachgereicht, die [die iOS-Version der Anwendung bereits seit längerem beherrscht][]: Das direkte Erstellen von Einmal-Passwörtern. Unterstützt wird dabei der [TOTP-Standard] (Time-Based One-Time Passwords), den unter anderem Firmen wie Evernote, Dropbox oder Google einsetzen, um ihre Zugänge besser abzusichern. Neben Account und regulärem Passwort wird dabei dann ein Zusatzcode verlangt, der nur kurze Zeit gilt.

Zur TOTP-Nutzung muss zunächst ein Startwert an 1Password übergeben werden. Das geht unter anderem per QR-Code, den die App über ein neues Scanfenster selbst einlesen kann – etwa aus dem Webbrowser. Eine Einführung in die Technik gibt [ein kurzes Video]. Die TOTP-Unterstützung in 1Password erlaubt es, auf ein zusätzliches Gerät (z.B. ein iPhone) neben dem Mac zu verzichten, das den Code liefert – was allerdings auch die Sicherheit verringert, weil es keinen “echten” zweiten Faktor mehr gibt.

Update 5.3 des Passwortmanagers liefert auch noch weitere Verbesserungen. So gibt es die Möglichkeit, FaceTime-Audio- oder Skype-Anrufe aus 1Password zu starten, die Zahl der Zusatzfelder in der Datenbank wurde erweitert und der Umgang mit unterschiedlichen Zeitzonen klappt besser. Die Engine zur Passworteingabe im Browser soll beschleunigt worden sein.

1Password kostet aktuell knapp 50 Euro im Mac App Store und setzt in seiner aktuellen Version mindestens OS X 10.10 voraus. ([bsc])

  [1Password scannt auch QR-Codes. ¶ (Bild: Hersteller)]: file://3.f.ix.de/scale/geometry/600/q75/imgs/18/1/4/6/2/3/5/1/Barcode-Scanner-With-Border-fc08c913da5cea5d.jpeg
  [AgileBits hat Version 5.3 seines bekannten Passwortmanagers 1Password für OS X freigegeben.]: https://itunes.apple.com/de/app/1password-password-manager/id443987910
  [die iOS-Version der Anwendung bereits seit längerem beherrscht]: file:///mac-and-i/meldung/Passwortmanager-1Password-mit-groesseren-Updates-fuer-OS-X-und-iOS-2529204.html
  [TOTP-Standard]: https://blog.agilebits.com/2015/01/26/totp-for-1password-users/
  [ein kurzes Video]: http://1pw.ca/TOTPvideoMac
  [bsc]: mailto:bsc@heise.de "Ben Schwan"
