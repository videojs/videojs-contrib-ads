# Roadmap

## Version 7

* Pause content video if there is a programmatic call to play (prefixed as adplay) while an ad is playing in an ad container (rather than content video element). Prefixing doesn't prevent the videojs behavior, so this would prevent the content from playing behind the ad. Right now, ad integrations I am aware of are doing this on their own, so this would require a migration to move the behavior into this project.
* `contentended` has a confusing name: real `ended` events are later sent, and that is when content should be considered ended. The `content` prefix is used for events when content is resuming after an ad. A better name would be `readyforpostroll`. That would make it clearer to implementations that the correct response would be to either play a postroll or send the `nopostroll` event. `resumeended`, which is a workaround for this issue, could then become `contentended`, which would mirror all the other redispatched events.
