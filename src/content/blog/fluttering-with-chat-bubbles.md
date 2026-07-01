---
title: "Fluttering with Chat Bubbles"
description: "Let’s be honest. We all wanted to make a perfect chat bubble like Telegram, WhatsApp, Signal and so on. But getting the pixel-perfect…"
pubDate: 2026-07-01
tags: []
draft: true
---
Let’s be honest. We all wanted to make a perfect chat bubble like Telegram, WhatsApp, Signal and so on. But getting the pixel-perfect bubble seems a little too challenging right? You make it perfect for text but it lags behind images and video. Sometimes you do not get a pixel-perfect timestamp placement and even if you do, the message does not seem to be in order.

![Man in sunglasses gesturing dismissively in a parking lot, a reaction meme](/blog/fluttering-with-chat-bubbles/1-rcnsybllzymracvqcfsmew.gif)

I faced this challenge when I was trying to build the chat bubble as close as possible to the current chat apps we use today. If you notice the chat bubble you will see that the time stamp has a little bit of offset relative to the message. This position changes when the text content is more. So defining this type of layout isn’t normally possible with the standard layout widgets.

![Signal purple sent message bubble reading Yo with 12:41 PM timestamp and read tick](/blog/fluttering-with-chat-bubbles/1-ivqnqk3-n3fx25f-1amiw.png "Chat bubble Signal")

Chat bubble Signal

![WhatsApp green sent bubble reading Hi with 6:24 PM timestamp and blue double ticks](/blog/fluttering-with-chat-bubbles/1-5cnxmbqvsedga890lcfzoq.png "Chat Bubble Whatsapp")

Chat Bubble Whatsapp

Now some would say, we could achieve that similar thing with the [Stack](https://api.flutter.dev/flutter/widgets/Stack-class.html) widget but Stack positions its children relative to the edges of its box. 

We could even do it with Align but Align takes the size of its parent, and I don’t want it to take all the space — it should take the space just as the message and the timestamp need it.

### So What’s the Solution?

We need to create a widget that should take the size just as much the child/children need it. For this, we need to go with a little low-level implementation. **_We will be talking about RenderObjects._**

If you like to watch videos and want to know more about RenderObjects, this video by Flutter would be for you

<div class="video-embed"><iframe src="https://www.youtube-nocookie.com/embed/cq34RWXegM8" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen loading="lazy"></iframe></div>

> This video also talks about creating a chat bubble using custom Render Objects but only handles the test case for Text messages. This blog would cover almost entirely everything a chat bubble would have (Text, Images, Videos, Replies).

If you would like to read more about the three trees, this blog would be the best to get you familiarized 😉

<a class="link-card" href="https://medium.com/flutter-community/the-layer-cake-widgets-elements-renderobjects-7644c3142401" target="_blank" rel="noopener"><img class="link-card-thumb" src="/blog/fluttering-with-chat-bubbles/1-adnechcdvzgzam5pdp9tua.jpg" alt="Row of cupcakes with teal frosting and rainbow sprinkles on pink" width="160" height="160"><span class="link-card-body"><span class="link-card-title">The Layer Cake</span><span class="link-card-desc">How Flutter uses Widgets, Elements and RenderObjects to create delicious eye-candy at 120fps.</span><span class="link-card-host">medium.com</span></span></a>

**Anyways back to our Solution!**

We would be using [_MultiChildRenderObject_](https://api.flutter.dev/flutter/widgets/MultiChildRenderObjectWidget-class.html) . Why this? Cause according to the docs

> A superclass for [RenderObjectWidget](https://api.flutter.dev/flutter/widgets/RenderObjectWidget-class.html)s that configure [RenderObject](https://api.flutter.dev/flutter/rendering/RenderObject-class.html) subclasses that have a single list of children. (This superclass only provides the storage for that child list, it doesn’t actually provide the updating logic.)

In simple words, we need to create a RenderObject that layout stuffs
