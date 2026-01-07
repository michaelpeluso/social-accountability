# Automating iOS Deployment with Expo EAS and GitHub Actions - Step-by-Step Guide

This guide will walk you through configuring your Apple Developer account, setting up app capabilities, and preparing a React Native app (built with Expo) for TestFlight distribution. We'll cover everything from Apple Developer Portal setup to GitHub Actions automation, with a focus on minimizing the need for a physical Mac. Each section is structured with clear steps, tips, and best practices for a smooth, future-proof deployment pipeline.

## 1\. Apple Developer Portal Setup

To distribute an iOS app via TestFlight or the App Store, you must configure identifiers, capabilities, certificates, and provisioning profiles in the Apple Developer portal. This ensures your app is properly identified and allowed to use special iOS features.

**Step 1: Create an App ID (Bundle Identifier)**  
Log in to your Apple Developer account and navigate to **Certificates, Identifiers & Profiles**. Under **Identifiers**, click the "+" button to register a new App ID (type _App_)[\[1\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=,same%20as%20permissions%20on%20Android). Use an **explicit Bundle ID** (in reverse domain style, e.g. com.yourcompany.yourapp) that matches the ios.bundleIdentifier in your Expo app config. This unique ID ties your app to its provisioning profile and capabilities[\[2\]](https://www.telerik.com/blogs/how-to-create-an-app-id-for-your-ios-app#:~:text=However%2C%20if%20you%20need%20to,plan%20to%20use%20app%20services)[\[3\]](https://www.telerik.com/blogs/how-to-create-an-app-id-for-your-ios-app#:~:text=In%20addition%20to%20what%20Apple,I%27ve%20also%20included%20Push%20Notifications).

**Step 2: Enable Required App Capabilities**  
After creating the App ID, select it from the Identifiers list and click **Edit**. Check the boxes for any iOS capabilities your app needs[\[4\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=Enable%20a%20capability). Enabling a capability allows your app to use certain Apple services or APIs. For example, you might enable:

- **HealthKit** - if your app reads or writes health data[\[5\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=HealthKit%20,limit). (Requires adding HealthKit usage descriptions in the app's Info.plist and a privacy policy - see _Permissions Strategy_ below.)
- **Push Notifications** - if your app will use remote notifications[\[6\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=Push%20Notifications%20%60aps,com.apple.developer.sensitivecontentanalysis.client). Enabling this will later require creating an APNs Auth Key or certificate for push delivery.
- **Background Modes** - if your app performs tasks in the background. Within this capability, enable specific modes:
- _Background Fetch_ (for periodic fetches)[\[7\]](https://docs.expo.dev/versions/latest/sdk/background-fetch/#:~:text=iOS)
- _Remote notifications_ (to receive push notifications that wake the app)
- _Location updates_ (if using continuous background location)
- **Screen Time (Family Controls)** - if justified, for using the Screen Time API (note: this is a sensitive capability that requires special permission from Apple)[\[8\]](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.family-controls#:~:text=Before%20submitting%20your%20app%20to,Adding%20capabilities%20to%20your%20app).
- **Calendars** - _Direct calendar access isn't an enable-able capability in the portal_ (it's controlled by user permission at runtime), but if your app reads calendar events you should still include usage descriptions in Info.plist.
- **Others as needed** - e.g. _Sign in with Apple_ (mandatory if your app offers other third-party login methods)[\[9\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=1.%20Sign,is%20essential%20for%20deep%20linking), _In-App Purchases_ (for subscriptions or purchases)[\[10\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=2.%20In,ensure%20compliance%20with%20Apple%E2%80%99s%20policies), _Associated Domains_ (for app links/deep linking)[\[11\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=policies,collaborative%20features%20or%20content%20sharing), etc.

Select **Save** to apply the changes. If a warning dialog appears about provisioning profiles, confirm the changes[\[12\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=2,to%20update%2C%20then%20click%20Edit)[\[13\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=,protection%2C%20iCloud%2C%20and%20push%20notifications). _Remember:_ Adding new capabilities invalidates existing provisioning profiles and they must be regenerated[\[14\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=You%20can%20view%20and%20enable,that%20use%20that%20App%20ID). Expo's build process can handle this automatically (more on that later), but it's good to be aware.

🔹 _Tip:_ Only enable capabilities you plan to use. Extra entitlements in your app can raise flags during App Store review if not clearly justified. For example, enabling HealthKit or Family Controls without implementing those features could lead to delays or rejections.

**Step 3: Create Signing Certificates**  
Navigate to **Certificates** in the Apple Developer portal and click "+" to create new certificates as needed:

- **Distribution Certificate (App Store and Ad Hoc)** - Required for TestFlight and App Store distribution. Choose _"App Store and Ad Hoc"_ and follow the steps to generate a Certificate Signing Request (CSR) on your computer, upload it, and download the generated .cer file[\[15\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=1,Certificates%20in%20the%20side%20bar)[\[16\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=7). Finally, export a .p12 from the .cer (you can do this on a Mac via Keychain Access, or using OpenSSL on other platforms). This certificate will be used to sign your app during the build. _(If you prefer not to handle files manually, you can let Expo handle certificate generation automatically in a later step.)_
- **APNs Auth Key (for Push Notifications)** - Instead of APNs certificates, Apple now recommends using a _push notifications Auth Key_. In the Developer portal, go to **Keys** and register a new key with the _Apple Push Notifications service (APNs)_ capability. Download the .p8 key file - this single key can be used for all your apps' push notifications. _You'll later upload this to Expo's credentials manager or EAS to enable push notifications._[\[17\]](https://www.amarjanica.com/how-to-set-up-push-notifications-in-expo/#:~:text=Scribbles%20www,right%20and%20choose%20environments)

Keep your certificate .p12 and APNs .p8 files secure. You will use their credentials (or let EAS handle them) when configuring Expo EAS builds.

**Step 4: Create a Provisioning Profile**  
A provisioning profile ties the App ID to your distribution certificate and includes enabled capabilities. In **Profiles** (under Certificates, IDs & Profiles), click "+" to create a new profile:

- Select **App Store** as the distribution method (for TestFlight/App Store distribution)[\[18\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=Register%20an%20App%20ID%20,Capabilities).
- Choose the App ID you created.
- Select the distribution certificate you created.
- Give the profile a name (e.g. _YourApp AppStore Profile_) and generate it. Download the .mobileprovision file.

If you plan to do internal ad-hoc builds (for example, install directly on devices outside TestFlight), you would also create an **Ad Hoc profile** including specific device UDIDs. However, ad-hoc distribution can be avoided here by using TestFlight or Expo's internal distribution, so an App Store profile is usually sufficient.

_(Again, if using Expo's automated credentials, it will create the profile for you - you may skip manual profile creation.)_

**Step 5: Special Entitlement Considerations**  
Some capabilities require extra steps or carry App Store review risks:

- **HealthKit:** Enabling HealthKit adds the com.apple.developer.healthkit entitlement. Apple's guidelines require that apps using HealthKit **actually provide health-related functionality** and respect user privacy. You must include NSHealthShareUsageDescription and NSHealthUpdateUsageDescription strings in your Info.plist explaining why you need HealthKit data[\[19\]](https://stackoverflow.com/questions/39716868/ios-app-reject-because-of-healthkit#:~:text=I%20am%20using%20,in%20my%20app). Also ensure your app's behavior clearly shows integration with the Health app (e.g. displaying health data) - Apple may reject an app that enables HealthKit but doesn't visibly use it[\[20\]](https://stackoverflow.com/questions/39716868/ios-app-reject-because-of-healthkit#:~:text=%3E%20Design%20,Health%20app%20in%20your%20Application). Always use HealthKit data solely to benefit the user (using it for advertising or data mining will violate guidelines). A Privacy Policy is required when using HealthKit data.
- **Background Modes (Background Fetch, Remote Notifications, etc.):** Using these allows your app to run code when not in the foreground. Apple will expect that any background activity is necessary for core app functionality (e.g. a fitness app updating step counts, a messaging app fetching messages). If you enable **Background Fetch**, add the fetch string to the UIBackgroundModes array in Info.plist[\[7\]](https://docs.expo.dev/versions/latest/sdk/background-fetch/#:~:text=iOS). For **background push** handling, include remote-notification. For continuous **background location**, include location in UIBackgroundModes. Be prepared to justify background usage during review (for example, _"background fetch is used to periodically refresh content so users have up-to-date data when they open the app"_).
- **Screen Time (Family Controls API):** The Screen Time/Family Controls capability (com.apple.developer.family-controls) is _highly restricted_. You **must request Apple's approval** to use this entitlement before submitting an app with it[\[8\]](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.family-controls#:~:text=Before%20submitting%20your%20app%20to,Adding%20capabilities%20to%20your%20app). This API is intended for parental control or digital wellbeing apps. If your app plans to track or limit device/app usage, you'll need to fill out Apple's request form explaining your use case. Only enable this capability when you are ready to use it and have a strong justification - Apple will reject apps using Family Controls without explicit permission. (Consider delaying this feature to a later release; see _Permissions Strategy_.)
- **Calendars / Reminders:** These don't require enabling an App ID capability, but they do require Info.plist usage descriptions (NSCalendarsUsageDescription). Make sure to add those if you will read or write calendar events. Apple will expect the feature to be clear to users (e.g. "Import your calendar to schedule workouts"). Always request permission in-app only at the moment it's needed.
- **Apple Wallet (Passes), Apple Pay, HomeKit, etc.:** Only enable if you need them. Some (like Apple Pay, HomeKit) may require additional setup (e.g. registering merchant IDs or HomeKit accessories). They can also trigger detailed App Store review of your implementation. Enable and configure these carefully according to Apple's documentation.

After configuring the above, your App ID should now have all necessary capabilities enabled. You can double-check in the portal under your App ID that the capabilities are listed as enabled (e.g. HealthKit, Push Notifications, etc.). Expo EAS will also attempt to sync these automatically during build (more on this below).

## 2\. App Store Connect Setup

With the Apple Developer Portal configured, the next step is to create an app record in **App Store Connect** and prepare TestFlight testing.

**Step 1: Create a New App Record**  
Log in to [App Store Connect](https://appstoreconnect.apple.com) and go to the **Apps** section. Click the **+** button and choose **"New App"**[\[21\]](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/#:~:text=1,on%20the%20top%20left). Fill in the details for your app:

- **Platform:** iOS (and any others your app supports; you can add platforms like iPadOS, watchOS, etc., but typically iOS alone suffices for a React Native app).
- **Name:** The app name as you want it to appear on the App Store. This must be unique across the App Store. You can change this later before release, but choose carefully.
- **Primary Language:** The default language for app metadata.
- **Bundle ID:** Select the App ID (bundle identifier) you registered in the developer portal from the dropdown[\[22\]](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/#:~:text=353%20Image%3A%20Screenshot%20of%20the,at%20the%20bottom%20of%20the). This ties the App Store Connect record to your provisioning setup. _You cannot change the bundle ID after creating the app._
- **SKU:** An internal string identifier (like a short code or version, used for your accounting or tracking). This can be any unique string; it won't be shown to users.
- **User Access:** If you have multiple team members, you can restrict who can see this app. Usually, leave as Full Access unless you need to limit.

Click **Create** to make the app record[\[23\]](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/#:~:text=5,messages%20indicating%20any%20missing%20information). The new app will initially be in _"Prepare for Submission"_ status (no build uploaded yet).

**Step 2: Enter App Information and Metadata**  
While not all information is required for TestFlight, filling out key metadata now will save time later and help testers understand the app:

- **Description, Keywords, Screenshots:** These are required for App Store release, but not for TestFlight internal testing. For external TestFlight (beta testing to outside users), Apple _does_ require a **beta description** and possibly screenshots to review the app. It's a good practice to draft a clear **app description** and have at least placeholder screenshots ready (you can use simulator or device captures). You can upload these in the App Store Connect **App Information** and **Version** sections.
- **App Icon:** Upload a 1024x1024 px app icon (rounded corners not required in the upload). This icon is required before you can submit to TestFlight external testing or App Store review. The icon upload is in the App Information page.
- **Privacy Policy URL:** If your app collects user data or uses HealthKit, etc., you must provide a privacy policy URL. Even for apps that don't obviously collect data, having a privacy policy is now essentially required. Add this URL in the App Privacy section or App Information section as needed[\[24\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=If%20you%20collect%20anything%20from,a%20link%20to%20privacy%20policy).
- **Data Privacy Questionnaire:** Apple will prompt you to answer questions about data types your app collects (e.g. contact info, health data, location) and how they're used (for tracking or not). Fill this out honestly. For any HealthKit data, you will mark it as data _not_ used for tracking or third-party sharing (assuming you only use it to display to the user). For location, specify if it's used for app functionality or analytics, etc. This generates the "Nutrition Label" privacy info visible on your App Store listing.
- **Compliance Questions:** When you upload your first build, you'll answer some compliance questions:
- **Encryption:** Does your app use encryption? (Most apps that just use HTTPS or standard Apple APIs can answer "YES" it uses standard encryption, _and_ "This app qualifies for exemption" since it's only using standard algorithms.)[\[25\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=You%27ll%20also%20need%20to%20answer,about%20data%20collection%20and%20usage)
- **Export Compliance:** If you use encryption, you typically need to check a box confirming you're in compliance with U.S. export laws (again, standard HTTPS usually qualifies for exemption).
- **Sign-in info:** If your app requires login, you may need to provide a demo account for testers/reviewers.
- **Content rights:** If your app includes third-party content (like user music, videos), you might need to confirm you have rights or it's user-provided.

These can be updated any time before submitting to App Review, but doing them early ensures nothing is forgotten.

**Step 3: TestFlight Configuration**  
TestFlight lets you distribute the app to testers before App Store release:

- **Internal Testers:** These are up to 100 members of your App Store Connect team (with roles like Developer, Admin, Marketer, etc.). They can access all builds immediately _without_ any beta review from Apple. To set up internal testing, go to your app in App Store Connect, then **TestFlight** tab, **Internal Testing**. Create an internal testing group (or use the default), add yourself and any team members as testers (using their Apple IDs)[\[26\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=Configure%20TestFlight). Once a build is uploaded and processed, you can toggle it on for the internal group and they'll be able to download it via the TestFlight app.
- **External Testers:** These are testers **outside your team** (e.g. clients, beta users, friends). You can invite up to 10,000 external testers by email. For external testers, Apple requires a **Beta App Review** for at least the first build (and any build that introduces new major features or permissions). To configure, in TestFlight tab add a **New Group** under External Testing, give it a name (e.g. "Beta Testers"), then add tester emails. When you have a build ready, you'll be able to submit it to external testers by providing **"Test Details"** - a brief description of what to focus on, and any test account info. Apple will review the build (usually within a day or two) and, once approved, your external testers will receive an email invite.
- **TestFlight Build Metadata:** For each build, you can (and should) provide:
- **What to Test:** A short note for testers about new features or areas to focus on.
- **Feedback Email:** Where tester feedback should be sent (you or your team's email).
- **Expiration:** TestFlight builds expire after 90 days by default.

When uploading via EAS or fastlane, you can supply some of this info; otherwise, you enter it in App Store Connect after the build is uploaded.

_Testing Tip:_ Install Apple's **TestFlight app** on your device. Once your build is available to you (either as an internal or external tester), you can download it through TestFlight and test the app exactly as the users would see it[\[27\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=internal%20group%2C%20add%20emails%20of,testers%20and%20save%20your%20changes).

**Step 4: Handling Sensitive Entitlements in App Store Connect**  
If your app uses certain sensitive capabilities (like HealthKit, Apple Health data, Motion, or Background Location), App Store Connect may prompt additional fields:

- For **HealthKit**, you must confirm that your app **integrates with the Health app** and describe its use. There's usually a checkbox during submission like "_Uses HealthKit_" and sometimes a text field to explain. Provide a concise explanation (similar to the review note we'll craft in _Permissions Strategy_). Also ensure the HealthKit usage is mentioned in your marketing description or "What's New" so reviewers see it's a feature.
- For **Bluetooth**, **Motion**, **Location**, etc., make sure you included usage descriptions in the binary. If you indicated in the privacy questionnaire that you collect these, it should align with your Info.plist keys.
- **Background Location**: If you request NSLocationAlwaysUsageDescription (allowing "Always" access), Apple will require you to also upload a short demo video or detailed explanation in the review notes to justify _why_ always-on location is needed. Plan to provide that when you submit for external beta or App Store review.

**Step 5: App Store Connect Summary**  
At this point, your App Store Connect record is set up with essential information. You have internal testers ready (or external testers invited, pending a build). Next, we'll configure Expo and EAS to build the app and push it to TestFlight.

## 3\. Expo and EAS Build Configuration

Expo's EAS (Expo Application Services) allows you to build iOS binaries in the cloud, which is perfect for a developer with limited access to a Mac. We will configure the Expo project for EAS, including build profiles and credentials.

**Step 1: Update Expo App Config (app.json/app.config.js)**  
Open your Expo app's **app.json** (or app.config.js). Ensure the iOS section contains the correct identifiers and any required native configuration:

- **Bundle Identifier:** In app.json under expo.ios.bundleIdentifier, set the bundle ID exactly to the one you registered (e.g. "bundleIdentifier": "com.yourcompany.yourapp"). EAS uses this to match the App ID[\[28\]](https://docs.expo.dev/build/building-on-ci/#:~:text=,distribution%20certs%20and%20provisioning%20profiles).
- **Version and Build Number:** Set expo.version (human-readable version, e.g. "1.0.0") and expo.ios.buildNumber (an incrementing string, e.g. "1"). Each App Store upload must have a higher build number than the previous. You can manage this manually or use EAS config to auto-increment.
- **Entitlements:** If your app needs special entitlements, add them under expo.ios.entitlements. Expo will include these in the native build and attempt to sync them to the Apple Dev Portal. For example:

- "ios": {  
   "bundleIdentifier": "com.yourcompany.yourapp",  
   "entitlements": {  
   "com.apple.developer.healthkit": true,  
   "aps-environment": "development"  
   }  
   }
- This sample would enable HealthKit and push notifications in the app's entitlements (the aps-environment key is automatically set to _production_ for release builds by EAS)[\[29\]](https://cdn.jsdelivr.net/npm/eas-cli@16.18.0/build/credentials/ios/appstore/bundleIdCapabilities.d.ts#:~:text=%27com.apple.developer.healthkit%27%3A%20true%2C%20%2A%20%27com.apple.developer.in,options%20to%20consider%20when%20syncing). Expo's build system **automatically synchronizes capabilities** on Apple's servers with these entitlements when you run an EAS build[\[30\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=automatically%20synchronizes%20capabilities%20on%20the,like%20AWS%20or%20Firebase%20services). (Supported entitlements include HealthKit, HomeKit, Apple Sign In, Push, etc. - see Expo docs for the full list[\[31\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=Group%20Activities%20%60com.apple.developer.group,domains.mdm)[\[32\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=Push%20Notifications%20%60aps,com.apple.developer.applesignin).)
- **Info.plist entries:** Some capabilities require Info.plist keys rather than entitlements:
- **Permissions Usage Descriptions:** Add any required usage strings in expo.ios.infoPlist. For example, if using camera, location, health data, calendar, etc., include keys like "NSCameraUsageDescription": "Needed to scan QR codes", "NSLocationWhenInUseUsageDescription": "Needed to show your current workout location on the map", "NSHealthShareUsageDescription": "App reads your step count from HealthKit for tracking goals", etc. These must clearly explain to the user why you need the permission.
- **Background Modes:** To support background fetch or background location, add UIBackgroundModes. For example:

- "ios": {  
   "infoPlist": {  
   "UIBackgroundModes": \["fetch", "remote-notification"\]  
   }  
   }
- This ensures the _Background Fetch_ and _Remote notifications_ modes are declared[\[7\]](https://docs.expo.dev/versions/latest/sdk/background-fetch/#:~:text=iOS). (Expo's config plugins for background tasks or notifications might do this for you when you install those libraries, but it's good to verify.) If you plan to use background location updates in the future, you would also include "location" in this array.
- **Bundle display name, icon, etc.:** Expo manages app name and icons via expo.name and the icon assets. Ensure those are set, as they will carry through to the binary.
- **Environment-specific config:** If you have separate configurations for development, staging, production (like different API endpoints or feature flags), plan how to handle them. You can use environment variables in EAS and read them in app.config, or maintain separate app.config.js logic per release channel. We'll see how eas.json profiles can inject env vars.

**Step 2: Create eas.json with Build Profiles**  
The eas.json file at your project root defines named build profiles for different scenarios. At minimum, set up profiles for development/internal testing, and production releases. For example:

{  
"build": {  
"development": {  
"distribution": "internal",  
"ios": {  
"simulator": false  
},  
"android": {  
"buildType": "apk"  
}  
},  
"preview": {  
"distribution": "store",  
"channel": "beta",  
"env": {  
"APP_ENV": "beta"  
}  
},  
"production": {  
"distribution": "store",  
"channel": "production",  
"env": {  
"APP_ENV": "production"  
}  
}  
}  
}

- The **development** profile above is for an _internal build_ that you might use for quick iteration or device testing. "distribution": "internal" tells EAS to create an _adhoc build_ (if iOS) that can be installed on specified devices or shared via a QR code/EAS link. (This requires registering your device UDIDs in Apple Dev Portal if used - optional if you rely purely on TestFlight for device testing.) Development builds often include debug configurations or even a **Dev Client** if you use Expo Dev Client.
- The **preview** profile could be used for TestFlight beta builds (for internal/external testers). Here "distribution": "store" produces an App Store-signed build (suitable for TestFlight). You might use a separate releaseChannel or EAS Update channel (e.g. "beta") so that these builds get OTA updates on a "beta" track. You can also set environment variables (like an APP_ENV flag) if your app needs to know it's a beta build.
- The **production** profile is for App Store release builds. It might use the main release channel and possibly have optimizations (like excluding certain logging, etc.). It will also be "distribution": "store".

Having separate profiles allows your CI to trigger different types of builds. For instance, every commit to main could trigger a preview build to TestFlight, whereas manual triggers or tags might invoke production build for submission to App Store.

**Step 3: Initialize EAS in the Project**  
If you haven't already, log in to Expo in your development environment (expo login or eas login) and run eas build:configure. This will prompt to create an eas.json (if you haven't made one) and register the project with Expo. It also sets up your **EAS project ID** in expo.android and expo.ios in app config. Ensure those changes are committed.

It's **highly recommended** to run a manual iOS build once locally (from your dev machine) to handle any interactive prompts. Run:

eas build -p ios --profile preview

The first time, EAS CLI will ask some questions (in interactive mode) to set up credentials and profiles if they aren't configured yet[\[33\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=My%20solution%20uses%20GitHub%20actions,them%20again%20in%20subsequent%20builds). Specifically, you may see prompts like:

- "It seems you don't have an iOS distribution certificate on file. How would you like to proceed?" (Choose **"Let Expo handle it"** to have EAS create or reuse a certificate automatically.)
- "No provisioning profile found, create a new one?" (Again, let Expo create it - it will tie to your App ID and certificate.)
- If using push notifications: "Generate an APNs push key?" (Expo can open the Apple site for you to create a push key if you haven't provided one. You can let it handle this, or you can manually upload an existing push key via eas credentials later.)

Once you authenticate with your Apple Developer account (or provide an App Store Connect API key - see below), Expo will configure the required **Distribution Certificate and Provisioning Profile** on Apple's servers automatically[\[33\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=My%20solution%20uses%20GitHub%20actions,them%20again%20in%20subsequent%20builds)[\[34\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=Easiest%20way%20to%20configure%20ios,profile%20and%20the%20distribution%20certificate). These credentials are stored securely in your Expo account (encrypted), so you can reuse them in CI without having to repeat this process. After this initial setup, future builds can run in non-interactive mode.

⚠️ **2FA Note:** If using your Apple ID for authentication, EAS CLI might prompt for a 6-digit 2FA code or ask you to log in via the web. As an alternative, you can use the App Store Connect API key method which is CI-friendly (no 2FA required). This is recommended for fully automating builds.

**Step 4: Configure Credentials (Automatic vs Manual)**  
Expo EAS gives you two approaches for iOS credentials:

- **Automatic (Managed) Credentials:** Expo will create and manage the certificate and provisioning profiles for you. This is easiest and reduces needing a Mac. The credentials are tied to your Apple Developer account but orchestrated by Expo. By default, eas build uses this mode. It will reuse credentials if available or create new ones when necessary. For example, if your distribution certificate expires in a year, EAS can auto-generate a new one and update profiles (especially if you provide an App Store Connect API key for non-interactive usage).
- **Manual Credentials:** If you prefer, you can manually provide a distribution certificate and provisioning profile. You might do this if you already have existing certs or want to reuse a single cert across multiple apps. You'd use eas credentials or the Expo web UI to upload the .p12 and password, and the .mobileprovision file. Expo will use those for the build. Given our scenario (limited Mac access), there's little advantage to manual management unless you have special requirements - the automatic approach is robust and easier.

**Push Notifications Setup:** If your app uses push notifications via Expo or Firebase Cloud Messaging on iOS, you'll need APNs credentials: - The recommended way is to use the APNs Auth Key (.p8) you created. You can store it in Expo's credentials by running eas credentials -p ios and following prompts to upload the key (or if you let Expo handle push setup during build, it might have done this). Alternatively, if you had chosen **"Let Expo handle push"** during the first build, Expo would have guided you to create an APNs key on Apple's site (since Apple requires a human to do that) and then you'd provide it to Expo. Once the APNs key is associated, Expo's push notification service (or any push service you use) will use it to send notifications to your app. Make sure the aps-environment entitlement is present (Expo adds this when you configure push, typically set to development for simulator/dev builds and production for TestFlight/app store builds).

**Step 5: Verify Capabilities and Profiles Sync**  
When you run the build, EAS CLI will attempt to **sync the app capabilities** (entitlements) with Apple. For supported capabilities, you'll see logs like _"Enabling HealthKit on Apple Developer Portal"_, etc. EAS uses the App Store Connect API for many operations, but some capabilities (like creating App Groups or certain services) require an authenticated session (Expo CLI will handle this if you logged in normally). If a capability in your entitlements isn't supported by Expo's automated system, you might get a warning and need to enable that one manually in the Developer Portal. (Refer to the Expo docs for which entitlements are auto-synced - e.g., HealthKit, HomeKit, Push, etc. _are_ supported[\[31\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=Group%20Activities%20%60com.apple.developer.group,domains.mdm)[\[32\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=Push%20Notifications%20%60aps,com.apple.developer.applesignin), but something like "Inter-App Audio" may need manual steps.) In our list, **Screen Time (Family Controls)** is likely one you must handle manually via Apple's site (and entitlement request) since it's gated by Apple.

Expo will also regenerate the provisioning profile if needed to include new capabilities[\[14\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=You%20can%20view%20and%20enable,that%20use%20that%20App%20ID). This ensures the build will have a valid profile containing all your enabled entitlements.

**Step 6: Setting Environment Variables for EAS Builds**  
Often you'll have API keys or config values that differ between development, preview, and production (for example, an API base URL, or a feature flag to disable certain dev features in production). Avoid hardcoding sensitive values in your code or config. Instead:

- Use **EAS Secrets** for sensitive values. You can run eas secret:create --name MY_SECRET --value &lt;value&gt; to store a secret (like an API key) on the Expo servers. In your app config, you can reference it via process.env.MY_SECRET if you include it in the build env.
- In eas.json profiles, under an env object you can define environment variables that will be available during the build. For example, in the preview profile above we set "APP_ENV": "beta". In your app code, you might check expo.constants.executionEnvironment or use Updates.releaseChannel or simply use process.env.APP_ENV if you've configured your bundler accordingly. Expo also supports **release channels** or the newer EAS **channels** for OTA update grouping; ensure you set those consistently (we used channel: "beta" vs "production" in the example).
- **Apple Credentials via Env:** If you want completely non-interactive builds, configure an App Store Connect API Key. After generating the API key (.p8, Key ID, Issuer ID as described earlier), set the following environment variables in your CI or locally (you can add these to your CI's secret store or as EAS secrets):
- EXPO*ASC_API_KEY_PATH - path to the *.p8\_ file (on CI, you might check out the key file or inject it as a base64 string and decode in a step).
- EXPO_ASC_KEY_ID - the 10-character Key ID.
- EXPO_ASC_ISSUER_ID - the UUID Issuer ID of your App Store Connect API key.
- EXPO_APPLE_TEAM_ID - your Apple Developer Team ID (e.g. ABCDE12345).
- EXPO_APPLE_TEAM_TYPE - usually not needed unless you're using an Enterprise team. For regular developer program, it's INDIVIDUAL or ORGANIZATION depending on your account type[\[35\]](https://docs.expo.dev/build/building-on-ci/#:~:text=You%20will%20need%20to%20create,information%20about%20your%20Apple%20Team)[\[36\]](https://docs.expo.dev/build/building-on-ci/#:~:text=,IN_HOUSE).

By providing these, EAS CLI in CI can authenticate with Apple to manage certificates/profiles if needed without any interactive login[\[37\]](https://docs.expo.dev/build/building-on-ci/#:~:text=,Token%20for%20your%20Apple%20Team).

**Step 7: Test the Build Locally (Optional)**  
Now that config and credentials are set, try running eas build -p ios --profile preview locally (or via GitHub Actions manually) and see if it succeeds. The first build might take some time as it caches dependencies and downloads simulators. If it succeeds, you'll have an .ipa file (if built locally) or a URL to the artifact on Expo's servers if built in the cloud.

If the build fails, check the logs: Expo CLI will provide a link to view logs in the terminal or on the Expo website. Common issues might be missing credentials (if you skipped some step), or native build errors if a config plugin is misbehaving. Expo also provides a **"Troubleshoot build errors"** guide[\[38\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=monorepo%20Build%20APKs%20for%20Android,44npx%20testflight%20%2046)[\[39\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=App%20signing) which you can consult if needed.

Once you have a successful build, you're ready to integrate this into GitHub Actions for continuous deployment.

## 4\. GitHub Actions Automation

We want to automate the build and TestFlight upload so that most of the heavy lifting happens in CI. The goal: the developer pushes code to a repository, and GitHub Actions runs an EAS build and uploads the app to TestFlight, with minimal manual intervention.

**Step 1: Set Up Repository Secrets**  
In your GitHub repository settings, under **Secrets and variables** -> **Actions**, define the following secrets (never store these in git):

- EXPO_TOKEN: An Expo personal access token[\[40\]](https://docs.expo.dev/build/building-on-ci/#:~:text=Provide%20a%20personal%20access%20token,your%20Expo%20account%20on%20CI). Generate one by visiting your Expo account settings (expo.dev) **Account > Access Tokens**. Give it a name (e.g. CI token) and generate. Add this token to GitHub as a secret. This allows CI to authenticate as you to run EAS builds and uploads. The Expo GitHub Action we'll use can accept this token[\[41\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=expo,output%20app.ipa).
- Apple App Store Connect API key credentials:
- APPSTORE_ISSUER_ID: The issuer UUID of your API key.
- APPSTORE_API_KEY_ID: The 10-char Key ID.
- APPSTORE_API_PRIVATE_KEY: The contents of the .p8 file. **Tip:** open the .p8 in a text editor and copy the whole text (including the -----BEGIN PRIVATE KEY----- and -----END PRIVATE KEY----- lines). Paste that into the secret value field. (GitHub will store it securely; the action we use will consume it.)

These will be used by an action to authenticate to App Store Connect for uploading the build to TestFlight[\[42\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=app,key%3A%20%24%7B%7B%20secrets.APPSTORE_API_PRIVATE_KEY).

- Any other secrets your app or build needs (for example, API keys for Sentry, etc. that you might set as env vars during build). Also consider an EAS_PROJECT_ID if needed (usually EAS can infer from the slug and your account if you logged in with EXPO_TOKEN).
- **Do not** store your Apple ID and password as secrets if you can avoid it (and certainly not your 2FA code). The API key method is preferred. If you absolutely had to use Apple ID (say, for _eas submit_ without an API key), you'd use an **app-specific password** and provide FASTLANE_USER and FASTLANE_PASSWORD secrets, but we won't go that route here.

**Step 2: Write the GitHub Actions Workflow**  
Create a workflow file (e.g. .github/workflows/ci-ios.yml). Use a Mac runner or Ubuntu runner depending on your approach:

**Option A: EAS Cloud Build (Ubuntu runner)** - This leverages Expo's cloud, saving GitHub minutes:

name: Build and Deploy iOS to TestFlight  
<br/>on:  
push:  
branches: \[ main \] # or whichever branch triggers TestFlight builds  
workflow_dispatch: {} # allow manual trigger  
<br/>jobs:  
build-and-submit:  
runs-on: ubuntu-latest  
steps:  
\- uses: actions/checkout@v4  
<br/>\- uses: actions/setup-node@v4  
with:  
node-version: 18  
<br/>\- run: npm ci # Install dependencies (or yarn install)  
<br/>\- name: Setup Expo and EAS  
uses: expo/expo-github-action@v8  
with:  
expo-version: latest  
eas-version: latest  
token: \${{ secrets.EXPO_TOKEN }} # Authenticate with Expo  
expo-cache: true # cache node_modules between runs  
<br/>\- name: Build iOS (Expo EAS)  
run: eas build --platform ios --profile preview --non-interactive --wait  
<br/>\- name: Submit to TestFlight  
run: eas submit --platform ios --profile preview --non-interactive \\  
\--apple-id \$APPLE_ID  
env:  
APPLE_ID: \${{ secrets.APPSTORE_ISSUER_ID }} # Actually, if using API key, eas submit will pick it up from env automatically  
EXPO_APPLE_APP_SPECIFIC_PASSWORD: \${{ secrets.APP_SPECIFIC_PASSWORD }}

Explanation: - We use the **expo/expo-github-action** to set up the environment. This action installs Expo CLI and EAS CLI for us[\[43\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=shell%3A%20bash%20,tokens) and logs in via the provided EXPO_TOKEN. It also can cache ~/.npm and ~/.expo to speed up subsequent runs. - We then run eas build with --wait so that the action will wait for the cloud build to finish. The --non-interactive flag is important to ensure the command fails rather than prompting for input if something is missing. Since we already configured credentials, this should proceed smoothly. - After a successful build, we run eas submit to upload the build to TestFlight. EAS Submit can use the API key we configured by environment variables, or we can specify --apple-id and --asc-app-id (the numeric App Store app ID) if needed. In our case, since we set the App Store Connect API key env vars (or secrets), EAS will find those. We could also use a separate App Store upload action as shown in Option B below.

**Option B: Local Build on Mac Runner (GitHub Actions)** - This avoids EAS cloud usage (which might incur cost after free builds) by using GitHub's macOS runner to compile the app locally. Note that macOS minutes are limited (and 10x charged for open source or free tiers). Still, for completeness:

jobs:  
build-and-submit:  
runs-on: macos-latest  
steps:  
\- uses: actions/checkout@v4  
\- uses: actions/setup-node@v4  
with:  
node-version: 18  
\- run: npm ci  
<br/>\- name: Setup Expo and EAS  
uses: expo/expo-github-action@v8  
with:  
expo-version: latest  
eas-version: latest  
token: \${{ secrets.EXPO_TOKEN }}  
<br/>\- name: Build iOS .ipa locally  
run: eas build --platform ios --profile preview --local --non-interactive --output=builds/app.ipa  
<br/>\- name: Upload to TestFlight  
uses: apple-actions/upload-testflight-build@v1  
with:  
app-path: builds/app.ipa  
issuer-id: \${{ secrets.APPSTORE_ISSUER_ID }}  
api-key-id: \${{ secrets.APPSTORE_API_KEY_ID }}  
api-private-key: \${{ secrets.APPSTORE_API_PRIVATE_KEY }}

In this approach, the Mac runner will perform a local build (eas build --local) which uses Xcode under the hood to compile the Expo prebuilt native project. This produces an app.ipa output. We then use Apple's official upload-testflight-build action to upload that .ipa to TestFlight[\[44\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=,key%3A%20%24%7B%7B%20secrets.APPSTORE_API_PRIVATE_KEY). This action uses the App Store Connect API key secrets to authenticate (as we provided). Once uploaded, the build will appear in App Store Connect > TestFlight, typically within 15-30 minutes of processing.

Both Option A and B are valid. Option A offloads the heavy build work to Expo's cloud (which might be faster and doesn't use Mac minutes, but if you exceed 15 free builds per month, Expo charges \$2/build[\[45\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=You%27ll%20get%2015%20iOS%20lower,can%20continue%20using%20GitHub%20actions)). Option B uses your GitHub minutes (macOS minutes are precious, though you get 300 free macOS minutes on GitHub Free which effectively count as 3,000 usage minutes after the 10x multiplier[\[46\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=With%20GitHub%20actions%20I%20get,expo%20charges%202)). You can decide based on cost and convenience: - If builds are infrequent (e.g., a couple per month), using EAS cloud (Option A) with the free tier is fine. - If you want to avoid any cost and don't mind using GH actions minutes, Option B can be used but keep an eye on time limits.

**Step 3: Triggering and Workflow Tips**  
Set the workflow to trigger on your desired events. Commonly: - On push to main (to deploy latest version to TestFlight internal testers, for example). - On tag (to deploy a specific release build). - Manual dispatch (so you can trigger it from the GitHub UI when you're ready).

You might use different profiles for different triggers (e.g., push to develop branch triggers an internal build, push to main triggers preview TestFlight build, and a tag triggers production build that you later submit to App Review).

Make sure to **increment the app version or build number** appropriately before each production release build. For TestFlight, you can reuse the same version number for multiple builds, but each new build must have a higher build number (the ios.buildNumber in app.json). Expo does **not** auto-increment build numbers by default. You can handle this by scripting a version bump in your CI (for example, using agvtool for iOS or npm version then commit, etc.), or manually bump in app.json when preparing a release.

**Step 4: Debugging CI Build Failures**  
Remote builds can fail for various reasons. Here are some tips for debugging:

- **View Logs:** Expo CLI will provide a URL to view build logs on the Expo website (if using cloud builds). Always check the logs; they're quite detailed. If using local Mac builds, the xcodebuild output will be in the Actions log.
- **Enable verbose logging:** You can run the build with EXPO_DEBUG=1 environment variable to get more verbose output[\[47\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=Debugging%20iOS%20capabilities). In GitHub Actions, you can add env: EXPO_DEBUG: true for the build step.
- **Common Issues:** Missing credentials (ensure Expo was logged in and had access to credentials), network issues downloading dependencies (EAS will retry, or you might add caching for node_modules in GH Actions). If a build fails because a profile or cert is not found (e.g., if you revoked something), you may need to run eas build:configure locally again or use eas credentials to fix it. Providing the Apple API key env vars in CI (as we did) helps EAS auto-fix provisioning issues on the fly.
- **Prebuilding for Debug:** If the error is in native iOS code (maybe from a config plugin or package), you can reproduce the native project locally. Run eas build -p ios --profile preview --local --no-wait on a Mac (or expo prebuild && npx pod-install to generate the iOS project) and then open the Xcode workspace to inspect issues. This is useful if, say, a certain capability wasn't added properly by a config plugin and Xcode shows a code signing error or missing entitlement.
- **Remote Access to Artifacts:** Expo can provide the built .ipa or even the Xcode debug symbols as artifacts. If your app crashes on launch, you might download the dSYM from EAS to symbolicate the crash. For CI debugging, you can use actions to upload logs or artifacts as needed (though usually not necessary with Expo's logging).
- **Rollbacks:** Since your CI is producing builds automatically, ensure you test critical builds (either via internal TestFlight or by installing the .ipa on a device) before promoting them widely. If a bad build goes out to external testers, you can expire it in App Store Connect by stopping external testing for that build.

**Step 5: Continuous Delivery Workflow**  
With automation in place, you can achieve a workflow like: - Developer merges to main -> CI triggers an EAS build -> after ~15 minutes, the new build is automatically available to internal testers on TestFlight (since internal testing needs no extra approval). - When ready to test externally, you switch that build to external testing in App Store Connect (providing test notes). You might also configure in App Store Connect TestFlight settings: "Automatically distribute new builds to existing testers" to reduce manual steps - then each new build that passes beta review will go out to external testers automatically. - Eventually, when you want to do an App Store release, you would run a production build (via CI or locally), then go to App Store Connect and submit that build for App Review (with final metadata). You can also automate App Store submission via eas submit for production, but many teams prefer to do the last step (pressing "Submit to App Review") manually to double-check everything.

## 5\. Mac Usage Optimization

One of the goals is to minimize reliance on a physical Mac, given you only have access to one about once a month. With the above setup, day-to-day development and deployment can largely be done on non-Mac machines. Here are critical tasks where a Mac is either required or highly useful, and how to optimize around them:

- **Initial Setup & One-Time Configurations:** Thanks to EAS, you can do initial certificate/profile setup on any machine (the Expo CLI handles contacting Apple's API). You do _not_ need Xcode to create certificates or provisioning profiles - we let Expo handle those. The only one-time action that might have required a Mac was creating the Certificate Signing Request (CSR) to get a distribution certificate, but Expo can even generate a CSR behind the scenes. Thus, initial provisioning can be zero-Mac if done via CLI.
- **Testing on iOS Simulator:** The iOS Simulator (emulator) only runs on macOS with Xcode. If part of your testing workflow involves checking the app on different iPhone/iPad simulators or using Xcode's debugging tools, you'd need a Mac for that. However, you can often test on a **real iPhone** instead. Using Expo Go during development is a quick way to test basic functionality on an iPhone (for most changes that don't involve native capabilities). For more complex testing (e.g., test the actual release build), deploying to your device via TestFlight is the alternative. It's slightly slower than an instant simulator build, but with CI doing builds, you might find it acceptable to wait ~15 minutes and then test on the device. Save your Mac day for when you need to deeply debug something (e.g., layout issues on certain iPhone sizes or iPad split screen, etc., that you can't easily test otherwise).
- **Xcode for Advanced Debugging:** In rare cases, you might need to open the native iOS project in Xcode - for instance, if a native module isn't working and you want to attach a debugger or view logs, or to use Instruments for performance profiling. With our Expo managed workflow, this should be minimal. If it happens, you can generate the iOS project (expo prebuild) and open it on your Mac day to troubleshoot. After fixing any issues, revert to managed workflow (or better, implement fixes via config plugins).
- **Certificate Management on Mac:** If you ever need to manually generate a Certificate (say Apple changes something or you want to use an existing cert), Keychain Access on Mac is the usual tool. But again, you can generate a CSR using OpenSSL on Windows/Linux, and upload to Apple Developer site to get a certificate. Converting .cer to .p12 can also be done via OpenSSL. So with some effort, even cert management can be done without Mac. Expo's managed approach eliminates the need for you to handle the .p12 at all in most cases.
- **Asset Catalog and App Icons:** If you need to create app icons or other image assets, you can do that on any OS using design tools. No Mac needed, unless you specifically want to use tools like Sketch which are Mac-only. Expo will take the PNG icon you provide and generate iOS app icons.
- **App Store Screenshots:** Eventually for App Store submission, you need screenshots for various device sizes. Options to do this without owning multiple devices or using a Mac: you can use browser-based emulator services or borrow devices. However, the iOS Simulator on Mac is the easiest way to get high-resolution screenshots. On your Mac day, you could run the app in Xcode's simulator for iPhone 14, iPad, etc., and capture screenshots. Alternatively, consider using a service like AWS Device Farm or BrowserStack App Live which can run your app on real iPhones in the cloud and allow screenshots.
- **Continuous Integration and Remote Mac**: Since you have GitHub Actions set up, you effectively have _remote Mac access_ through the macos-latest runner. If something must be done on Mac (like running a fastlane tool), you can create a workflow for it. For example, you could automate screenshot generation using fastlane snapshot on a Mac runner. This uses your CI minutes instead of your personal Mac. It's a trade-off but can fill gaps when you can't physically be at a Mac.

**Minimizing Ongoing Mac Usage:**  
With the pipeline we established, you should only need a Mac in scenarios like: - **Major SDK upgrades:** Upgrading Expo SDK or React Native might introduce native changes. If something goes wrong, having a Mac to run the app and debug is useful. But generally, Expo SDK upgrades are tested to work via EAS as long as you follow the migration steps. - **Unanticipated build issues:** If out of nowhere the iOS build fails and it's not obvious why, you might drop to a Mac to run Xcode for clarity. However, often the logs from EAS are enough to diagnose. - **App Store final submission:** When it's time to release to the App Store (not just TestFlight), some developers prefer to do this in Xcode's Organizer (Archive -> Upload) out of habit. You don't need to - we can submit using EAS or Transporter app on any Mac or even via CI with fastlane. But pressing the release button for App Store (after Apple approves the app) is done in App Store Connect web, which works from any browser.

Plan your one-day-per-month Mac access to batch any tasks that truly require Xcode or macOS. For example, you could use that day to: update to the latest Xcode and run a test build, generate screenshots, and manually verify that TestFlight build on simulator for sanity. Everything else (coding, building, distributing) can be done from your primary development OS (Windows/Linux) thanks to Expo and CI.

## 6\. Permissions Strategy and App Store Approval

Your app intends to use several high-risk permissions/capabilities (HealthKit, location, Screen Time API, calendar access, etc.). Apple's App Store Review process scrutinizes such permissions to ensure they are justified and used responsibly. It's wise to **stage the introduction of these features** over time and prepare clear explanations for reviewers. Here's a strategy:

**Staged Rollout of Sensitive Features:**  
Don't enable or request all permissions at once in your first release. Focus on core functionality first (Milestones M1-M4 as you outlined), then introduce additional integrations in later updates[\[48\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=M5%2B%20features%20require%20additional%20permissions%2C,prove%20value%2C%20then%20expand%20carefully). This approach has multiple benefits: - You reduce the chance of a broad rejection; initial versions stay simpler and face fewer potential objections. - You can prove the app's value and build a track record. Apple may be more lenient once your app has a history of good behavior and user value. - You can **learn from users** which features they actually want, so you only add the necessary permissions.

As noted in your roadmap, introduce **"one permission at a time"** in post-v1 milestones[\[49\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=1.%20%2A%2AShip%20M1,forward%2A%2A%20%28never%20surprise%20users). For example, you might release v1 with just Notifications and maybe basic HealthKit (if core to your app), then in v1.1 add Calendar access, v1.2 add more HealthKit metrics, v1.3 add Screen Time API, etc. Each time, you'll explain the new permission to Apple in the submission notes and to users in the app's onboarding.

**Justifying Permissions to Apple:**  
When you add a permission, use the _Review Notes_ field during App Store submission to clearly and succinctly justify why the app needs it. The reviewers should easily understand the user benefit and that you're not abusing the data. Here are example explanations for each sensitive permission (you can adapt these for the actual Notes or "purpose string" in Info.plist):

- **HealthKit (Health Data)** - _"This app integrates with HealthKit to help users track their fitness habits. We read step count and workout data from the user's Health app to display their progress toward daily exercise goals. For example, if the user took 5,000 steps today, our app shows that in their daily goal tracker. All HealthKit data is used locally in-app - we do not upload or share it externally_[_\[50\]_](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=5)_. The integration with the Health app is a core feature to provide personalized fitness insights to the user."_  
   _(Ensure that in the app's UI/description, you highlight these health features, so it's obvious to reviewers that HealthKit is integral and beneficial.)_
- **Location (Especially Background Location)** - _"Our app uses location data to enhance the user's habit tracking experience. Specifically, we offer an_ _automatic workout check-in_ _feature: when the app detects that a user arrives at their gym (a location they can set in-app), it will remind them to log a workout or starts tracking exercise duration_[_\[51\]_](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=5)[_\[52\]_](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=,%240%20but%20battery%20drain)_. This requires location access_ even when the app is backgrounded*, so the user can get timely reminders without opening the app. Location data is* _not_ _stored on our servers or used for any advertising; it stays on device and is only used to trigger these personal notifications. The user must explicitly enable "Always Allow" location and can disable it anytime from iOS Settings or within the app's settings."_  
   For background location, also mention any visual indicators you provide (e.g., an icon in the status bar when location is used) and that it's truly essential (Apple is very strict here - the feature should not work at all without background location; if it's just a nice-to-have, consider using only When In Use). If background location is introduced later (M5 milestone)[\[53\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=5), ensure you have this strong use-case argument ready and perhaps implement a limited "while in use" version first to test the waters.
- **Screen Time API (Family Controls)** - _"Our app uses the Screen Time API to help users monitor and reduce their usage of certain distracting apps as part of their habit goals_[_\[54\]_](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=5)_. For example, a user can set a goal not to use social media apps for more than 1 hour a day; our app reads the device's Screen Time data for social networking category to show their progress and encourage them. This data is accessed through Apple's Family Controls API with the user's consent. We only read usage durations - we do not see content of what they browse. All usage data stays on-device and is displayed privately to the user. This feature aims to promote digital wellbeing in line with the app's mission."_  
   Because the Screen Time API requires Apple's explicit approval, you should also mention you have requested the entitlement. Provide any supporting evidence that your app's concept truly aligns with what Apple expects (e.g., parental control or wellness). _Only include this feature after you've been granted the entitlement._ Also note to the reviewer that if you haven't been granted it yet, the feature will be inactive (or better, hide it entirely until approval to avoid rejection).
- **Calendar Access** - _"The app requests read-only access to the user's Calendar to intelligently schedule habit reminders_[_\[55\]_](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=5)_. For instance, if the user plans a daily meditation habit, the app looks at their calendar to avoid sending a reminder during a meeting or busy event. It only reads event start/end times and titles to find free slots for reminders. This makes notifications smarter and less intrusive. Calendar data is not stored or sent anywhere - it's only used on-device to adjust the timing of reminders."_  
   Emphasize the convenience to the user. Calendar is less controversial than HealthKit or location, so a brief note suffices. Just ensure the usage description clarifies the benefit (e.g. "Allow access to your Calendar so we can schedule habit reminders at free times and avoid conflicts.").
- **Notifications** - _"The app uses notifications to remind users about their habit tasks and to provide motivational quotes. Users will receive at most 3 alerts per day, and they can customize these or opt out entirely in the app settings. Notifications are crucial for keeping users engaged and helping them build consistent habits (e.g., a reminder at 9 PM to reflect on their day). We do not use notifications for ads or promotions, only for user-requested reminders."_  
   Apple requires that notification content be relevant and not spam. It's good to mention users have control over it. Also, if using _Time Sensitive Notifications_ (one of the new iOS notification types), you'd mention why they are time-sensitive (likely not needed here unless you have urgent alerts).
- **Background Fetch** - _"We enable Background Fetch to periodically update certain data (like syncing the latest community posts or new recommendations) so that when the user opens the app, they see fresh content without waiting_[_\[7\]_](https://docs.expo.dev/versions/latest/sdk/background-fetch/#:~:text=iOS)_. These background refreshes happen infrequently (at most once per few hours) and have minimal impact on battery."_  
   Usually you don't need to explicitly justify background fetch unless the app's use of it is questionable, but it doesn't hurt to mention it if you had a reviewer question it.

In addition to reviewer notes, make sure your **in-app user experience** justifies the permission at runtime. For example, when you first trigger the HealthKit or location permission prompt, precede it with a screen explaining _why_ it's needed ("We'd like to connect to Apple Health to import your exercise data and save you time… \[Allow\] \[Not now\]"). A tester or reviewer going through the app will then understand the context, which makes them more likely to approve.

**App Store Guidelines and Risks:**  
Apple's guidelines (particularly sections 5.x on privacy and data use, and 4.x on design/feature) are relevant: - HealthKit data cannot be used for anything other than improving health/fitness for the user, and must not be shared to third parties without explicit consent. Ensure your app abides by this (it sounds like you do, processing on-device and not monetizing it - which is good). Apple will reject if, for example, they suspect you are using health or location data for ad targeting. - Background location usage must be clearly beneficial - Apple will reject apps that request "Always" location without a compelling reason. From your plan, auto check-in at gym is a compelling reason if implemented well. Just be prepared to possibly show them a demo or video of how the app uses location to do that. - Family Controls (Screen Time) apps often face heavy scrutiny - sometimes Apple limits these to certain developers or requires additional documentation. You might need to demonstrate that feature thoroughly when the time comes. - If any of these features are not critical, consider marking them "Not Available" for initial App Store release, then enable for a 2.0 release after some user base is built. This is exactly what your roadmap suggests (deferring many of them to M5+)[\[56\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=M5%2B%20features%20require%20additional%20permissions%2C,prove%20value%2C%20then%20expand%20carefully).

**Permission Milestones Example:**  
Based on your _Milestone 5_ notes, a possible rollout: - **v1.0:** Core social habit tracking features. Minimal permissions - maybe notifications and basic HealthKit (steps count) only. No calendar, no location, no ScreenTime yet. This keeps the first App Review straightforward. In review notes, you'd mainly talk about HealthKit (if included) and that's it. - **v1.x:** Add Calendar integration (permission) once users request scheduling features. In that update's review notes, justify Calendar as above. - **v1.x:** Add more HealthKit data (e.g. workouts, heart rate) once you have a use for them[\[50\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=5). Each time, update the HealthKit usage descriptions if needed and note what new data you're accessing and why. - **v2.0 (or later):** Add Screen Time API integration for digital wellness habits[\[54\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=5), and Background Location for automatic check-ins[\[51\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=5). These are high-risk and should be introduced only after you've built trust and ideally after discussing with Apple if needed (sometimes you can reach out via the Apple Developer Support line or ask a question in Apple Developer Forums to get guidance _before_ attempting to release such features).

**In Summary:** Always align the use of sensitive APIs with a clear user benefit and communicate that benefit. Keep a **privacy-forward** stance - data stays on device or is clearly opt-in - which you are already planning (e.g. local processing)[\[57\]](file://file-EpFGJV88hE5mks1C7ML8f9#:~:text=). Apple appreciates apps that improve user life while respecting privacy and will be more likely to approve your app if you demonstrate that ethos.

By following this comprehensive setup, you will have: an Apple Developer account configured with all necessary identifiers and capabilities, an Expo project ready to build with EAS, continuous integration delivering builds to TestFlight, and a strategy to handle permissions in a user-friendly and Apple-compliant way. This maximizes automation and minimizes the need for a Mac, allowing you to develop and deploy efficiently. Good luck with your app launch and iterative improvements - with this pipeline, distributing new versions (whether for testing or release) should be low friction and quick 🚀.

**Sources:**

- Apple Developer Documentation - _Enabling Capabilities & Certificates_: Enabling app services like HealthKit, push notifications, etc., requires updating the App ID in Apple's portal[\[4\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=Enable%20a%20capability)[\[58\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=Enable%20push%20notifications). Changes may necessitate regenerating provisioning profiles[\[14\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=You%20can%20view%20and%20enable,that%20use%20that%20App%20ID). Apple's help doc notes how to enable capabilities and the need to confirm and save changes[\[12\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=2,to%20update%2C%20then%20click%20Edit). Enabling certain services (Sign in with Apple, Push, etc.) involves additional steps[\[13\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=,protection%2C%20iCloud%2C%20and%20push%20notifications)[\[58\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=Enable%20push%20notifications).
- Expo Documentation - _iOS Capabilities Auto-Sync_: Expo EAS Build will automatically sync supported entitlements (like com.apple.developer.healthkit for HealthKit, aps-environment for push) with the Apple Developer Console during build[\[30\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=automatically%20synchronizes%20capabilities%20on%20the,like%20AWS%20or%20Firebase%20services). Supported capabilities include HealthKit and Family Controls (Screen Time) among others[\[31\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=Group%20Activities%20%60com.apple.developer.group,domains.mdm)[\[32\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=Push%20Notifications%20%60aps,com.apple.developer.applesignin).
- Expo Blog - _CI/CD with GitHub Actions_: Running EAS builds on CI requires an Expo token for authentication[\[40\]](https://docs.expo.dev/build/building-on-ci/#:~:text=Provide%20a%20personal%20access%20token,your%20Expo%20account%20on%20CI). It's recommended to run a first build locally to set up credentials interactively, then use non-interactive mode on CI[\[33\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=My%20solution%20uses%20GitHub%20actions,them%20again%20in%20subsequent%20builds)[\[34\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=Easiest%20way%20to%20configure%20ios,profile%20and%20the%20distribution%20certificate). The blog example demonstrated using a Mac runner to do a local build and upload with an API key[\[44\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=,key%3A%20%24%7B%7B%20secrets.APPSTORE_API_PRIVATE_KEY)[\[42\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=app,key%3A%20%24%7B%7B%20secrets.APPSTORE_API_PRIVATE_KEY).
- Project Planning Docs - _Staged Permissions_: It's wise to introduce "one permission at a time" in later milestones[\[49\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=1.%20%2A%2AShip%20M1,forward%2A%2A%20%28never%20surprise%20users). For instance, Screen Time API was marked as **HIGH risk** and planned for post-v1 expansion, with clear justification needed[\[54\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=5). Background Location was noted as **VERY HIGH risk**, to be used for automatic gym check-ins with strict justification[\[53\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=5). These insights support delaying those features until necessary and being prepared with strong explanations to Apple.

[\[1\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=,same%20as%20permissions%20on%20Android) [\[9\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=1.%20Sign,is%20essential%20for%20deep%20linking) [\[10\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=2.%20In,ensure%20compliance%20with%20Apple%E2%80%99s%20policies) [\[11\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=policies,collaborative%20features%20or%20content%20sharing) [\[24\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=If%20you%20collect%20anything%20from,a%20link%20to%20privacy%20policy) [\[25\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=You%27ll%20also%20need%20to%20answer,about%20data%20collection%20and%20usage) [\[26\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=Configure%20TestFlight) [\[27\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=internal%20group%2C%20add%20emails%20of,testers%20and%20save%20your%20changes) [\[33\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=My%20solution%20uses%20GitHub%20actions,them%20again%20in%20subsequent%20builds) [\[34\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=Easiest%20way%20to%20configure%20ios,profile%20and%20the%20distribution%20certificate) [\[41\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=expo,output%20app.ipa) [\[42\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=app,key%3A%20%24%7B%7B%20secrets.APPSTORE_API_PRIVATE_KEY) [\[43\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=shell%3A%20bash%20,tokens) [\[44\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=,key%3A%20%24%7B%7B%20secrets.APPSTORE_API_PRIVATE_KEY) [\[45\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=You%27ll%20get%2015%20iOS%20lower,can%20continue%20using%20GitHub%20actions) [\[46\]](https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/#:~:text=With%20GitHub%20actions%20I%20get,expo%20charges%202) Publish Expo app to TestFlight with Github Actions

<https://www.amarjanica.com/submit-expo-ios-app-to-apple-appstore/>

[\[2\]](https://www.telerik.com/blogs/how-to-create-an-app-id-for-your-ios-app#:~:text=However%2C%20if%20you%20need%20to,plan%20to%20use%20app%20services) [\[3\]](https://www.telerik.com/blogs/how-to-create-an-app-id-for-your-ios-app#:~:text=In%20addition%20to%20what%20Apple,I%27ve%20also%20included%20Push%20Notifications) How to Create an App ID for Your iOS App

<https://www.telerik.com/blogs/how-to-create-an-app-id-for-your-ios-app>

[\[4\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=Enable%20a%20capability) [\[12\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=2,to%20update%2C%20then%20click%20Edit) [\[13\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=,protection%2C%20iCloud%2C%20and%20push%20notifications) [\[14\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=You%20can%20view%20and%20enable,that%20use%20that%20App%20ID) [\[15\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=1,Certificates%20in%20the%20side%20bar) [\[16\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=7) [\[18\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=Register%20an%20App%20ID%20,Capabilities) [\[58\]](https://developer.apple.com/help/account/identifiers/enable-app-capabilities/#:~:text=Enable%20push%20notifications) Enable app capabilities - Identifiers - Account - Help - Apple Developer

<https://developer.apple.com/help/account/identifiers/enable-app-capabilities/>

[\[5\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=HealthKit%20,limit) [\[6\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=Push%20Notifications%20%60aps,com.apple.developer.sensitivecontentanalysis.client) [\[30\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=automatically%20synchronizes%20capabilities%20on%20the,like%20AWS%20or%20Firebase%20services) [\[31\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=Group%20Activities%20%60com.apple.developer.group,domains.mdm) [\[32\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=Push%20Notifications%20%60aps,com.apple.developer.applesignin) [\[38\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=monorepo%20Build%20APKs%20for%20Android,44npx%20testflight%20%2046) [\[39\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=App%20signing) [\[47\]](https://docs.expo.dev/build-reference/ios-capabilities/#:~:text=Debugging%20iOS%20capabilities) iOS capabilities - Expo Documentation

<https://docs.expo.dev/build-reference/ios-capabilities/>

[\[7\]](https://docs.expo.dev/versions/latest/sdk/background-fetch/#:~:text=iOS) BackgroundFetch - Expo Documentation

<https://docs.expo.dev/versions/latest/sdk/background-fetch/>

[\[8\]](https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.family-controls#:~:text=Before%20submitting%20your%20app%20to,Adding%20capabilities%20to%20your%20app) Family Controls | Apple Developer Documentation

<https://developer.apple.com/documentation/bundleresources/entitlements/com.apple.developer.family-controls>

[\[17\]](https://www.amarjanica.com/how-to-set-up-push-notifications-in-expo/#:~:text=Scribbles%20www,right%20and%20choose%20environments) How to Set up Push Notifications in Expo - Ana's Dev Scribbles

<https://www.amarjanica.com/how-to-set-up-push-notifications-in-expo/>

[\[19\]](https://stackoverflow.com/questions/39716868/ios-app-reject-because-of-healthkit#:~:text=I%20am%20using%20,in%20my%20app) [\[20\]](https://stackoverflow.com/questions/39716868/ios-app-reject-because-of-healthkit#:~:text=%3E%20Design%20,Health%20app%20in%20your%20Application) app store connect - iOS app reject because of healthkit - Stack Overflow

<https://stackoverflow.com/questions/39716868/ios-app-reject-because-of-healthkit>

[\[21\]](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/#:~:text=1,on%20the%20top%20left) [\[22\]](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/#:~:text=353%20Image%3A%20Screenshot%20of%20the,at%20the%20bottom%20of%20the) [\[23\]](https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/#:~:text=5,messages%20indicating%20any%20missing%20information) Add a new app - Create an app record - App Store Connect - Help - Apple Developer

<https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/>

[\[28\]](https://docs.expo.dev/build/building-on-ci/#:~:text=,distribution%20certs%20and%20provisioning%20profiles) [\[35\]](https://docs.expo.dev/build/building-on-ci/#:~:text=You%20will%20need%20to%20create,information%20about%20your%20Apple%20Team) [\[36\]](https://docs.expo.dev/build/building-on-ci/#:~:text=,IN_HOUSE) [\[37\]](https://docs.expo.dev/build/building-on-ci/#:~:text=,Token%20for%20your%20Apple%20Team) [\[40\]](https://docs.expo.dev/build/building-on-ci/#:~:text=Provide%20a%20personal%20access%20token,your%20Expo%20account%20on%20CI) Trigger builds from CI - Expo Documentation

<https://docs.expo.dev/build/building-on-ci/>

[\[29\]](https://cdn.jsdelivr.net/npm/eas-cli@16.18.0/build/credentials/ios/appstore/bundleIdCapabilities.d.ts#:~:text=%27com.apple.developer.healthkit%27%3A%20true%2C%20%2A%20%27com.apple.developer.in,options%20to%20consider%20when%20syncing) cdn.jsdelivr.net

<https://cdn.jsdelivr.net/npm/eas-cli@16.18.0/build/credentials/ios/appstore/bundleIdCapabilities.d.ts>

[\[48\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=M5%2B%20features%20require%20additional%20permissions%2C,prove%20value%2C%20then%20expand%20carefully) [\[49\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=1.%20%2A%2AShip%20M1,forward%2A%2A%20%28never%20surprise%20users) [\[50\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=5) [\[51\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=5) [\[52\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=,%240%20but%20battery%20drain) [\[53\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=5) [\[54\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=5) [\[55\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=5) [\[56\]](file://file-NfYVW4QhKjZXevZonyR4tr#:~:text=M5%2B%20features%20require%20additional%20permissions%2C,prove%20value%2C%20then%20expand%20carefully) M501-integrations-expansion.md

file://file-NfYVW4QhKjZXevZonyR4tr

[\[57\]](file://file-EpFGJV88hE5mks1C7ML8f9#:~:text=) M8-future.md

file://file-EpFGJV88hE5mks1C7ML8f9
