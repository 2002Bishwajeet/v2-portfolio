---
title: "Can we build a Cross-Platform game using Flutter and Flame?"
description: "With the announcement of Flutter 2.8, the Flame engine also rolled out a stable 1.0.0 version."
pubDate: 2022-07-10
tags: []
canonicalURL: "https://medium.com/@bishwajeet-parhi/can-we-build-a-cross-platform-game-using-flutter-and-flame-3132db7c74d6"
---
![Flutter and Flame logos joined by a red plus sign](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-duvv6iutaue7kyz-zcatsg.png)

Flutter and Flame logo

With the announcement of [_Flutter 2.8_](https://medium.com/flutter/announcing-flutter-2-8-31d2cb7e19f5)_, the_ **Flame engine** also rolled out a stable **1.0.0** version.

![Flutter 2.8 release announcement art over a 3D low-poly landscape](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/0-9jweeqcqqylorl8z.png)

flutter 2.8 reveal

**But wait a minute !!!**

### What is Flame?

> Flame is a modular Flutter game engine that provides a complete set of out-of-the-way solutions for games. It takes advantage of the powerful infrastructure provided by Flutter but simplifies the code you need to build your projects.

> It provides you with a simple yet effective game loop implementation, and the necessary functionalities that you might need in a game. For instance; input, images, sprites, sprite sheets, animations, collision detection and a component system that we call Flame Component System (FCS for short).

![Flame engine homepage with its flame logo and Get Started button](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-1nuug4pk5nnfj8kltujzsg.png)

flame homepage

So, if creating games in Flutter is possible, **_why not create one?_** The idea here is to make a game that works on all the major platforms and provides the same gaming experience.

<a class="link-card" href="https://flame-engine.org/" target="_blank" rel="noopener"><span class="link-card-body"><span class="link-card-title">Flame</span><span class="link-card-desc">2D game engine made on top of Flutter</span><span class="link-card-host">flame-engine.org</span></span></a>

### Let’s Talk about how Flame works

In Flutter, everything is a widget, similarly, in Flame engine, everything is a component. The below image shows the basic lifecycle of how the game engine runs.

![Flame component lifecycle diagram: onGameResize, onLoad, onMount, update, render, onRemove](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/0-yjjga3di607w4sj7.png)

Lifecycle of Flame Engine

Let’s learn more about it while we build a game.

![Man in a suit excitedly shouting Game On, a reaction GIF](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/0-nuu4nigpe-sqr4kb.png)

### So, what are gonna build?

I was thinking of making an arcade/action-type game. The idea is we have a player with a weapon, we have a 2D map — ground, some floating grounds, and kinds of stuff. There would be enemies( currently 3 types) — waves of enemies and the goal is to eliminate all of them. The number of enemies would increase with each wave passing and it will go on until his health runs out. Thus we will then calculate his score. Since I was thinking of a cross-platform game, we would be having a high score board too. This was some sort of rough diagram I made 😂.

![Hand-drawn sketch planning the player, enemy types, waves and floating platforms](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-4jq-rkicabg8dl0wgo2zdg.png)

Something I thought of making with my brother

### Let’s set up our project

You know what, I prepared some initial setup for you in a repo. Just clone it and we will be on the same page.

<a class="link-card" href="https://github.com/2002Bishwajeet/mini_wars/tree/initial-setup" target="_blank" rel="noopener"><img class="link-card-thumb" src="/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/0-rrf00a1opvkhdppu.png" alt="" width="160" height="160"><span class="link-card-body"><span class="link-card-title">GitHub - 2002Bishwajeet/mini_wars at initial-setup</span><span class="link-card-desc">A Mini action game built using Flutter and Flame. Backend used Appwrite. Flame is a modular Flutter game engine that…</span><span class="link-card-host">github.com</span></span></a>

Before moving on, let’s check out the dependencies in the project which we are gonna use in this project and I will keep adding them when needed (as this isn’t gonna be a single blog😉).

![pubspec dependencies list including flame, appwrite, flutter_riverpod and flame_forge2d](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-xmyphmxhq6raopdovurkxw.png)

As you can see I added the `flame` dependency. That’s important to develop games in Flutter.

<a class="link-card" href="https://pub.dev/packages/flame" target="_blank" rel="noopener"><img class="link-card-thumb" src="/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/0-rqmssre3x-tr7ujk.png" alt="" width="160" height="160"><span class="link-card-body"><span class="link-card-title">flame | Flutter Package</span><span class="link-card-desc">A Flutter-based game engine. English | 简体中文 | Polski | Русский | Español | 日本語 The full documentation for Flame can be…</span><span class="link-card-host">pub.dev</span></span></a>

I have also imported `flame_forge2d` and `flame_audio` package. We will discuss more about this later.

<a class="link-card" href="https://pub.dev/packages/flame_forge2d" target="_blank" rel="noopener"><img class="link-card-thumb" src="/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/0-tqe-da9d-alppuvn.png" alt="" width="160" height="160"><span class="link-card-body"><span class="link-card-title">flame_forge2d | Flutter Package</span><span class="link-card-desc">Flame Forge2D - The bridge between Flame and Forge2D This library acts as a bridge between Forge2D (our port of Box2D)…</span><span class="link-card-host">pub.dev</span></span></a>

<a class="link-card" href="https://pub.dev/packages/flame_audio" target="_blank" rel="noopener"><img class="link-card-thumb" src="/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/0-ioqrfi-kbg4albj.png" alt="" width="160" height="160"><span class="link-card-body"><span class="link-card-title">flame_audio | Flutter Package</span><span class="link-card-desc">Adds audio support for Flame using the audioplayers package. This package makes it easy to add audio capabilities to…</span><span class="link-card-host">pub.dev</span></span></a>

For some light state management, I use `riverpod` , it’s my all-time favorite state-management solution.

<a class="link-card" href="https://pub.dev/packages/flutter_riverpod" target="_blank" rel="noopener"><img class="link-card-thumb" src="/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/0-ejt1szr1xupzccn3.png" alt="" width="160" height="160"><span class="link-card-body"><span class="link-card-title">flutter_riverpod | Flutter Package</span><span class="link-card-desc">A state-management library that: catches programming errors at compile time rather than at runtime removes nesting for…</span><span class="link-card-host">pub.dev</span></span></a>

And for Backend solutions, I used `appwrite` — an open-source firebase alternative. It’s rising its popularity these days and I love its simplicity on how easily you can use it. To know more about appwrite:

<a class="link-card" href="https://appwrite.io/" target="_blank" rel="noopener"><img class="link-card-thumb" src="/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/0-5ts-746llko-8en.png" alt="" width="160" height="160"><span class="link-card-body"><span class="link-card-title">Appwrite - Open-Source End-to-End Backend Server</span><span class="link-card-desc">Appwrite provides web and mobile developers with a set of easy-to-use and integrate REST APIs to manage their core…</span><span class="link-card-host">appwrite.io</span></span></a>

I won’t go deeper in appwrite (I have already made a series in it, refer from [here](https://bishwajeet-parhi.medium.com/building-no-signal-app-using-flutter-and-appwrite-8b31358b5975?source=your_stories_page-------------------------------------)), as this would be more oriented on game development, though I would talk some things about it which when required.

Now, this branch contains all the setup — the assets we are gonna use, an initial overlay (main menu), some utility classes, and the dependencies added.

> **NOTE:** The assets used are all taken from [itch.io](http://itch.io) . And these are assets are completely free to use for commercial purposes too.

Now if you open the project, there are some _TODOs_ that we need to complete initially. But before that, I hope you have set up appwrite and integrated into your Flutter project (refer to this [site](https://appwrite.io/docs/getting-started-for-flutter) for setup).

**Now Let’s Complete those TODOs**

I will start first with `client.dart` file.

![client.dart defining an Appwrite Client provider with endpoint and project](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-slv7gdj37nvbbfbr1-zeaq.png)

For me these are those settings, your endpoint could be different here if you set the default port. Your project Id could also be different here. Just make sure you double-check them in the appwrite Dashboard.

Now Let’s Look at the `Authentication.dart` file. There are 3 functions we need to complete.

-   _getAccount()_
-   _login()_
-   _loginAnonymous()_
-   _logout()_

Before moving forward, lemme tell you something. We would be using an OAuth2 for authentication. I was thinking since we are making a game, why not add a **Discord OAuth** here. Now the great part here is that Appwrite supports more than **20 OAuth providers** and _Discord_ is one of them.

**Let’s Learn how to add setup Discord OAuth provider**

**STEP 1:** Go to [discord/developers/applications](https://discord.com/developers/applications) . Login if asked.

**STEP 2:** Click on **_New Application_**

![Discord developer portal with the New Application button highlighted](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-kpjfiiupc6s917-el8wviw.png)

**STEP 3:** Give a name to your app . For me it’s Mini Wars. For you it could be anything or same. Click Create.

![Discord Create an Application dialog with the name Mini Wars entered](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-66mirjhbyrqh8mvw2gnxew.png)

![Discord app General Information page showing Application ID and Public Key fields](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-vcpxbqtjlgxlkhmvvub3sw.png)

You would see something like this. It’s your wish if you want to add a description and tags.

What we want here is an _APPLICATION ID_ and _PUBLIC KEY_.

**STEP 4:** Head over to Appwrite Dashboard -> Users -> Settings

![Appwrite dashboard Users Settings tab listing auth methods and OAuth2 providers](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-9arxhhkvbi8exsrovacvia.png)

Look for Discord OAuth under OAuth2 Providers

**STEP 5:** Enter the following fields and copy the **redirect URL**

![Appwrite Discord OAuth2 settings dialog with App ID, secret and redirect URI](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-00cvuczh-lrpga68fbys5g.png)

**STEP 6:** Now in the Discord Developer Portal — go to OAuth2 -> general and add the redirect URL there

![Discord OAuth2 general page adding the Appwrite redirect URIs](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-dwwkwsfgvlfmg6gxow8mhw.png)

**That’s it, all the things have been done from the server-side. Let’s code now**

> REMINDER: Keep yourself Hydrated

Let’s Code `Authentication` class file

![Authentication class with getAccount, login and logout methods using Appwrite](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-jahfqgxsmfcheqgyuzacdw.png)

That implements all the utility functions needed for Authentication. One thing to note is that OAuth **does not work** in the Windows Flutter app. This is because the appwrite uses `flutter_web_auth` package to authenticate users.

<a class="link-card" href="https://github.com/LinusU/flutter_web_auth" target="_blank" rel="noopener"><img class="link-card-thumb" src="/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/0-81eno3x0jmm5ihu9.png" alt="" width="160" height="160"><span class="link-card-body"><span class="link-card-title">GitHub - LinusU/flutter_web_auth: Flutter plugin for authenticating a user with a web service</span><span class="link-card-desc">Flutter plugin for authenticating a user with a web service - GitHub - LinusU/flutter_web_auth: Flutter plugin for…</span><span class="link-card-host">github.com</span></span></a>

_Since this does not support Windows and Linux platforms yet, authentication is not yet possible. You can track this issue_ [_here_](https://github.com/LinusU/flutter_web_auth/issues/22). But it works well on other platforms (Web, iOS, Android, macOS)

Let’s complete the final function on the `main_menu` screen and let’s finally move on to the game logic.

![main_menu code with a loading state and Play button onPressed calling auth.login](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-jhuc74fh8f3pvriobsbhbq.png)

And in the `onPressed` function of the Play Button, let’s add this for now:

```
widget.gameRef.overlays.remove(MainMenu.routename);
```

That completes our work for the time being on `main_menu` screen for now. Let’s talk more about **Flame now**

* * *

### How do you add a component inside a widget?

In Flutter everything’s a widget as I mentioned in the blog above. How are you gonna run a Flame engine on top of it which needs components?

This is where `GameWidget` comes to the rescue. Let’s look at the code of `main.dart` .

![main.dart wrapping the MiniWars game in a GameWidget with overlay routes](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-dxqmo5cn-idqnhumj6gizg.png)

To add a `Game Component` inside a widget, we need `GameWidget<T>` and thus you pass your object in the parameter. This is only required once cause we are mainly adding either `FlameGame` or `Forge2DGame` component and thus from there we manage adding or removing components.

You may have one more question here, Why not simply add `MiniWars()` in the parameter instead of creating a variable and then passing it?

This is because when you hot reload every time, a new object instance is always created so it kinda works like hot restart. So it’s kinda annoying when your game just relaunches again and again for some really small changes. So we have added this just for debugging purposes and would remove it in production. So it’s better to add a **TODO** here to not forget yourself.

**Let’s create** `mini_wars.dart` file. We will be creating a single `Forge2DGame` instance that manages everything for our game to run.

### So Forge2DGame and not FlameGame?

Forge2D is basically a ported version of the [Box2D](https://box2d.org/documentation/) physics engine (written in C++). Some of the features like a rigid body, gravity, continuous collision, etc come out of the box with this package. We could use FlameGame but that means writing more boilerplate. Also, I will be just experimenting here for now, and let’s see what fits better.

![mini_wars.dart MiniWars class extending Forge2DGame and loading the background](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-rtaunbltu5z5ijpt8hgcgw.png)

This is the initial `mini_wars.dart` file. You see that I have extended the `Forge2DGame` .

Now `Forge2DGame` has some functions which can be overridden. I would recommend just going through the source code and reading the comments for a better understanding. Seems overwhelming at first but then you would get the hang of it. Let’s talk about those methods which I would be overriding for the time being now.

`onLoad()` Method. As the name suggests, before late initialization, this would load all things you need (like images, audio, make some HTTP calls to fetch something, etc). This method would be only called once in a lifetime. By default, it returns null.

Here I wanted to add a `mainMenuBackground` before everything gets initialized. Oh yes, When the game starts, our `MiniWars` object is called and an initial overlay `MainMenu` widget is displayed. For background, we add `mainMenuBackground` component and then we remove it after we click play.

**Let’s Look at the** `background_component.dart` **file**

![background_component.dart loading four parallax layers into a ParallaxComponent](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-fh5aztkhty13qs-yqfytq.png)

Flame Supports Parallax out of the box so you don’t need to hardcode it yourself😉. I had a parallax background image in 4 strips.

![Four layered parallax background strips combining into a sky and hills scene](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-amillpedtoe80io200vxjw.png)

These 4 images combined to form a background and they need to be repeated. Thus Parallax.

So we created a map of _paths_ with their _velocity multipliers. The next_ thing we had to do is load all the parallax layers as done above.

Then `ParallaxComponent` has a `Parallax` object. We used the setter and added all the parallax layers with base velocity and size.

**Read more about ParallaxComponent here**

<a class="link-card" href="https://docs.flame-engine.org/1.2.0/flame/components.html#parallaxcomponent" target="_blank" rel="noopener"><img class="link-card-thumb" src="/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/0-hf95alxkjs4ottka.png" alt="" width="160" height="160"><span class="link-card-body"><span class="link-card-title">Components - Flame</span><span class="link-card-desc">Children can be added either with the add(Component c) method or directly in the constructor. Example: The onMount…</span><span class="link-card-host">docs.flame-engine.org</span></span></a>

### Let’s see how it looks so far

I will show you the outputs from 3 Platforms (Windows, Android, and web)

![Mini Wars main menu running on Windows with a scrolling parallax background](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-xhsjjrvi3ovndjtivxwu7w.gif)

Windows

![Mini Wars main menu running in a browser with a scrolling parallax background](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-dykfjonqgfm-7qc76fqlhg.gif)

Web

![Mini Wars main menu running on an Android phone in landscape](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-ryw-dq2pe-g3gi5lpdk0vw.gif)

Mobile

_Well, I don’t know what to say but it looks_

![Two men chatting, one saying it's freakin awesome, a reaction GIF](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/0-cxossbq8hmch5oem.png)

### Now onto adding the player on the screen

I have also included the Player sprites in the repo itself. Just take a look at it. And these are all sprite sheets, i.e we will animate them. Now if you have used [SFML](https://www.sfml-dev.org/) in C++, you had to manually write some logic code for those animated sprite sheets but luckily Flame Engine does a `SpriteAnimationComponent` which can animate your sprites. Since we have a bunch of Spritesheet which include — jumping, crouching, idle, walking, running, etc; we need `SpriteAnimationGroupComponent<T>` . Thus, we will change the sheet on the component when the following action is performed. Say when jumping, we use jumping sprite sheet and so on.

**Let’s work on** `player_component.dart` **file.** We will first work on animating the sprite first then we will add some movement. Let’s define an **_enum_** `_PlayerState_` _._

![PlayerState enum listing idle, crouch, running, jumping and other states](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-yntmubfqx7pywxamgvvgqq.png)

**Let’s create our** `Player` **class .** Just read this doc and you will understand better of how `SpriteGroupComponent` works.

<a class="link-card" href="https://docs.flame-engine.org/1.2.0/flame/components.html#spriteanimationgroup" target="_blank" rel="noopener"><img class="link-card-thumb" src="/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/0-cezlwos4hspzu1vl.png" alt="" width="160" height="160"><span class="link-card-body"><span class="link-card-title">Components - Flame</span><span class="link-card-desc">Children can be added either with the add(Component c) method or directly in the constructor. Example: The onMount…</span><span class="link-card-host">docs.flame-engine.org</span></span></a>

```dart
class Player extends SpriteAnimationGroupComponent<PlayerState>
    with KeyboardHandler {
  Player()
      : super(
          size: Vector2.all(6.2),
          anchor: Anchor.center,
          current: PlayerState.idle,
        );

  late final SpriteAnimation idleAnimation;
  late final SpriteAnimation crouchAnimation;
  late final SpriteAnimation crouchShootAnimation;
  late final SpriteAnimation hithurtAnimation;
  late final SpriteAnimation runningAnimation;
  late final SpriteAnimation jumpingAnimation;
  late final SpriteAnimation landingAnimation;
  late final SpriteAnimation deadAnimation;

  @override
  bool onKeyEvent(RawKeyEvent event, Set<LogicalKeyboardKey> keysPressed) {
    if (event is RawKeyDownEvent) {
      if (keysPressed.contains(LogicalKeyboardKey.space)) {
        current = PlayerState.jumping;
      } else if (keysPressed.contains(LogicalKeyboardKey.controlLeft)) {
        current = PlayerState.crouch;
      } else if (keysPressed.contains(LogicalKeyboardKey.keyD) ||
          keysPressed.contains(LogicalKeyboardKey.arrowRight)) {
        current = PlayerState.running;
        if (transform.scale.x == -1) transform.flipHorizontally();
      } else if (keysPressed.contains(LogicalKeyboardKey.keyA) ||
          keysPressed.contains(LogicalKeyboardKey.arrowLeft)) {
        current = PlayerState.running;
        if (transform.scale.x == 1) transform.flipHorizontally();
      }
    }
    if (event is RawKeyUpEvent) {
      current = PlayerState.idle;
    }

    return true;
  }

  @override
  Future<void> onLoad() async {
    await super.onLoad();
    await loadAnimatedSprites();
    animations = {
      PlayerState.idle: idleAnimation,
      PlayerState.crouch: crouchAnimation,
      PlayerState.crouchShoot: crouchShootAnimation,
      PlayerState.hithurt: hithurtAnimation,
      PlayerState.running: runningAnimation,
      PlayerState.jumping: jumpingAnimation,
      PlayerState.landing: landingAnimation,
      PlayerState.dead: deadAnimation,
    };
  }

  @override
  void update(double dt) {
    super.update(dt);
  }

  @override
  void render(Canvas canvas) {
    super.render(canvas);
  }

  Future<void> loadAnimatedSprites() async {
    idleAnimation = await SpriteAnimation.load(
      'spritesheets/player/john_idle.png',
      SpriteAnimationData.sequenced(
        amount: 5,
        stepTime: 0.25,
        textureSize: Vector2(26, 22),
      ),
    );

    crouchAnimation = await SpriteAnimation.load(
      'spritesheets/player/john_crouch.png',
      SpriteAnimationData.sequenced(
        amount: 2,
        stepTime: 0.25,
        loop: false,
        textureSize: Vector2(24, 26),
      ),
    );

    crouchShootAnimation = await SpriteAnimation.load(
      'spritesheets/player/john_crouch_shoot.png',
      SpriteAnimationData.sequenced(
        amount: 2,
        stepTime: 0.25,
        textureSize: Vector2(26, 26),
      ),
    );

    hithurtAnimation = await SpriteAnimation.load(
      'spritesheets/player/john_hithurt.png',
      SpriteAnimationData.sequenced(
        amount: 2,
        stepTime: 0.25,
        textureSize: Vector2(27, 21),
      ),
    );

    runningAnimation = await SpriteAnimation.load(
      'spritesheets/player/john_run.png',
      SpriteAnimationData.sequenced(
        amount: 10,
        stepTime: 0.15,
        textureSize: Vector2(26, 22),
      ),
    );

    jumpingAnimation = await SpriteAnimation.load(
      'spritesheets/player/john_jump.png',
      SpriteAnimationData.sequenced(
        amount: 9,
        stepTime: 0.25,
        textureSize: Vector2(26, 23),
      ),
    );

    landingAnimation = await SpriteAnimation.load(
      'spritesheets/player/john_landing.png',
      SpriteAnimationData.sequenced(
        amount: 3,
        stepTime: 0.25,
        textureSize: Vector2(26, 22),
      ),
    );

    deadAnimation = await SpriteAnimation.load(
      'spritesheets/player/john_dead.png',
      SpriteAnimationData.sequenced(
        amount: 5,
        stepTime: 0.25,
        textureSize: Vector2(26, 22),
      ),
    );
  }
}
```

Look at the source code carefully. Each `SpriteAnimation` variable denotes the sprite sheet animation to shift. It has a variable `current` which shows the current state to show. I have set to idle. We also added a mixin `KeyboardHandler` to change the animations by pressing keys.

<a class="link-card" href="https://docs.flame-engine.org/1.2.0/flame/inputs/keyboard-input.html" target="_blank" rel="noopener"><img class="link-card-thumb" src="/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/0-p7jxdx-seqon96g.png" alt="" width="160" height="96"><span class="link-card-body"><span class="link-card-title">Keyboard Input - Flame</span><span class="link-card-desc">Edit description</span><span class="link-card-host">docs.flame-engine.org</span></span></a>

The next thing to do is load all the sprite sheets. I created a separate function and called in `onLoad()` function. Then I linked it with the correct key values. Then all was left to complete `onKeyEvent` .

### Let’s check it out now.

Don’t forget to create a variable in `MiniWars` and add it using the Play button `onTap` function.

![Play button onPressed removing the menu overlay and adding the hero player](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-0c4cks3fsyi0p102bbhfzq.png)

**and in** `mini_wars.dart` **file**

```
final Player hero = Player();
```

### Live Time

![Animated player character standing on the ground in the parallax game scene](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/1-5a-vo9guo12zo553ob0f4g.gif)

Sprite Animation

![Man in a suit declaring I am Jose Mourinho, a confident reaction GIF](/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/0-rkd4b-93phuizxgg.gif)

**I will end this blog here**. In the next part, I will talk about involving the physics of the player, gesture input for mobile devices, and maybe add some more sprites or something?

If you want to reach me, you can by the following handles:

<a class="link-card" href="https://linktr.ee/2002Bishwajeet" target="_blank" rel="noopener"><img class="link-card-thumb" src="/blog/can-we-build-a-cross-platform-game-using-flutter-and-flame/0-tvw6qkjhbbhc-5fn.jpg" alt="" width="160" height="160"><span class="link-card-body"><span class="link-card-title">Bishwajeet Parhi | Linktree</span><span class="link-card-desc">Open Source Enthusiast | Flutter Developer | Video Editor | Pianist</span><span class="link-card-host">linktr.ee</span></span></a>

#### Stay Tuned for more ✨
