# Dinner Wheel

Spin a wheel to pick tonight's dinner, and add recipes as you try new ones.
Recipes are saved with Netlify Blobs, so everyone in the house sees the same list.

## Deploy (pick one)

**Option A: GitHub (easiest to keep updating)**
1. Create a new GitHub repo and upload everything in this folder.
2. In Netlify: Add new site > Import an existing project > pick the repo.
3. Leave the build command empty. Netlify reads `netlify.toml`. Click Deploy.

**Option B: Netlify CLI from your computer**
1. Install Node.js, then in this folder run `npm install`.
2. Run `npx netlify-cli deploy --prod` and follow the prompts to create a site.

Note: Netlify's drag-and-drop "Drop" upload does NOT run functions, so recipes
would only save on each device. Use A or B.

## Optional: lock editing with a passcode
Anyone with the link can view and spin. To stop strangers from editing,
add an environment variable in Netlify (Site configuration > Environment variables):

    APP_PASSCODE = something-only-your-family-knows

Redeploy. The first time someone adds or edits a recipe on a device, the app
asks for the passcode and remembers it on that device.

## Files
- `public/index.html` - the whole app (wheel, recipe list, form)
- `netlify/functions/recipes.mjs` - the API at `/api/recipes` that stores recipes
- `netlify.toml` - tells Netlify where things are
