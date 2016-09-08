# RingCentral Call Log Data to Box Demo App

This is a demo application which pulls call log data from RingCentral and uploads to Box

## Prerequisites

* RingCentral Account w/ Platform access [Sign up for your free RingCentral Developer Account](https://developer.ringcentral.com/free-tier-sign-up.html)
* Box Developer Account [Sign up for your free Box Developer Account](https://account.box.com/signup/n/developer)
* App defined in both services
    * RingCentral:
        * Platform Type: Server Only (NO UI)
        * API Permissions: ReadAccount, ReadCallLog
    * Box:
        * Auth App
* Node.js


## Installation

1. Clone the repository `git clone https://github.com/bdeanindy/bdean-rc-box.git`
2. Rename the **.env.tmpl** to **.env** `mv .env.tmpl .env`
3. Fill in the values of the **.env** file which are blank
4. Install the dependencies `npm install`


## Usage

1. Once you have completed all of the above steps, just use the `npm start` command.
2. Open the Admin Console of Box and view the master contents (to view the app data): [https://app.box.com/master/content](https://app.box.com/master/content)


## License

Copyright (c) <2016> <copyright Benjamin Dean and RingCentral, Inc.>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
