# Community chat setup

The chat is embedded in `games/index.html` and uses Firebase Authentication and Realtime Database, so it can share messages across Netlify and GitHub Pages. Each host must be listed as an authorized domain in Firebase Authentication.

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com/) and add a Web app.
2. In **Authentication > Sign-in method**, enable **Anonymous** and **Email/Password**.
3. In **Realtime Database**, create a database and copy its URL (for example, `https://your-project-default-rtdb.firebaseio.com`).
4. Copy the web app's `apiKey`, `authDomain`, `projectId`, and `appId`, plus the database URL, into [`chat-config.js`](chat-config.js).
5. In **Authentication > Settings > Authorized domains**, add the Netlify hostname and the GitHub Pages hostname that will serve the site.
6. In **Realtime Database > Rules**, replace the rules with the following and click **Publish**. The username reservation, private profile, admin check, announcement, site controls, chat bans and moderation, multiplayer rooms, public-room directory, room chat, and message write rules must all be live in the same database used by `chat-config.js`:

```json
{
  "rules": {
    "usernames": {
      "$username": {
        ".read": "auth != null",
        ".write": "auth != null && newData.isString() && newData.val() === auth.uid && (!data.exists() || data.val() === auth.uid)",
        ".validate": "newData.isString() && newData.val() === auth.uid"
      }
    },
    "profiles": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": "auth != null && auth.uid === $uid",
        ".validate": "newData.hasChildren(['name', 'nameKey'])",
        "name": {
          ".validate": "newData.isString() && newData.val().length >= 3 && newData.val().length <= 20 && newData.val().toLowerCase() === newData.parent().child('nameKey').val()"
        },
        "nameKey": {
          ".validate": "newData.isString() && newData.val().matches(/^[a-z0-9_]{3,20}$/) && root.child('usernames').child(newData.val()).val() === auth.uid"
        },
        "$other": {
          ".validate": false
        }
      }
    },
    "admins": {
      "$uid": {
        ".read": "auth != null && auth.uid === $uid",
        ".write": false,
        ".validate": "newData.isBoolean()"
      }
    },
    "announcement": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('admins').child(auth.uid).val() === true",
      ".validate": "newData.hasChildren(['uid', 'text', 'createdAt'])",
      "uid": {
        ".validate": "newData.isString() && newData.val() === auth.uid"
      },
      "text": {
        ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 240"
      },
      "createdAt": {
        ".validate": "newData.isNumber() && newData.val() <= now && newData.val() > now - 60000"
      },
      "$other": {
        ".validate": false
      }
    },
    "siteControl": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('admins').child(auth.uid).val() === true",
      "defaults": {
        ".validate": "newData.hasChildren(['theme', 'accent'])",
        "theme": {
          ".validate": "newData.isString() && newData.val().matches(/^(emerald|ocean|ember)$/)"
        },
        "accent": {
          ".validate": "newData.isString() && newData.val().matches(/^(theme|mint|blue|coral|gold|aqua)$/)"
        },
        "$other": {
          ".validate": false
        }
      },
      "theme": {
        ".validate": "newData.isString() && newData.val().matches(/^(local|emerald|ocean|ember)$/)"
      },
      "accent": {
        ".validate": "newData.isString() && newData.val().matches(/^(theme|mint|blue|coral|gold|aqua)$/)"
      },
      "partyMode": {
        ".validate": "newData.isBoolean()"
      },
      "refreshToken": {
        ".validate": "newData.isString() && newData.val().matches(/^[0-9]+-[a-z0-9]+$/)"
      },
      "forcedGame": {
        ".validate": "newData.hasChildren(['folder', 'token', 'sentAt']) && newData.child('folder').isString() && newData.child('folder').val().matches(/^[a-z0-9_-]+$/) && newData.child('token').isString() && newData.child('token').val().matches(/^[0-9]+-[a-z0-9]+$/) && newData.child('sentAt').isNumber()",
        "folder": {
          ".validate": "newData.isString() && newData.val().matches(/^[a-z0-9_-]+$/)"
        },
        "token": {
          ".validate": "newData.isString() && newData.val().matches(/^[0-9]+-[a-z0-9]+$/)"
        },
        "sentAt": {
          ".validate": "newData.isNumber()"
        },
        "$other": {
          ".validate": false
        }
      },
      "accessGate": {
        ".validate": "newData.hasChildren(['salt', 'hash', 'iterations']) && newData.child('salt').isString() && newData.child('salt').val().matches(/^[0-9a-f]{32}$/) && newData.child('hash').isString() && newData.child('hash').val().matches(/^[0-9a-f]{64}$/) && newData.child('iterations').isNumber() && newData.child('iterations').val() === 210000",
        "salt": {
          ".validate": "newData.isString() && newData.val().matches(/^[0-9a-f]{32}$/)"
        },
        "hash": {
          ".validate": "newData.isString() && newData.val().matches(/^[0-9a-f]{64}$/)"
        },
        "iterations": {
          ".validate": "newData.isNumber() && newData.val() === 210000"
        },
        "$other": {
          ".validate": false
        }
      },
      "$other": {
        ".validate": false
      }
    },
    "chatBans": {
      ".read": "auth != null",
      ".write": "auth != null && root.child('admins').child(auth.uid).val() === true",
      "users": {
        "$uid": {
          ".validate": "newData.isBoolean()"
        }
      },
      "names": {
        "$nameKey": {
          ".validate": "$nameKey.matches(/^[a-z0-9_]{3,20}$/) && newData.isBoolean()"
        }
      },
      "$other": {
        ".validate": false
      }
    },
    "classroomRooms": {
      "$roomCode": {
        ".read": "auth != null",
        ".write": "auth != null && ((!data.exists() && newData.child('players/x').val() === auth.uid) || (data.exists() && (data.child('players/x').val() === auth.uid || data.child('players/o').val() === auth.uid || (data.child('status').val() === 'waiting' && data.child('players/o').val() === null && newData.child('players/o').val() === auth.uid && newData.child('players/x').val() === data.child('players/x').val()))))",
        ".validate": "newData.hasChildren(['players', 'names', 'board', 'turn', 'status', 'createdAt', 'game', 'isPrivate', 'hostUid']) && newData.child('players/x').isString() && (newData.child('players/o').val() === null || newData.child('players/o').isString()) && newData.child('board').hasChildren(['0', '1', '2', '3', '4', '5', '6', '7', '8']) && newData.child('game').val().matches(/^(tic-tac-toe|chess)$/) && (newData.child('game').val() !== 'chess' || (newData.child('fen').isString() && newData.child('pgn').isString())) && newData.child('isPrivate').isBoolean() && newData.child('hostUid').isString() && newData.child('turn').val().matches(/^(x|o)$/) && newData.child('status').val().matches(/^(waiting|playing|won|draw)$/) && (newData.child('winner').val() === null || newData.child('winner').val().matches(/^(x|o)$/)) && newData.child('createdAt').isNumber()",
        "players": {
          "x": {
            ".validate": "newData.isString() && ((!data.exists() && newData.val() === auth.uid) || newData.val() === data.val())"
          },
          "o": {
            ".validate": "newData.val() === null || (newData.isString() && ((!data.exists() && newData.val() === auth.uid) || newData.val() === data.val()))"
          }
        },
        "names": {
          "x": {
            ".validate": "newData.isString() && newData.val().length <= 20"
          },
          "o": {
            ".validate": "newData.val() === null || (newData.isString() && newData.val().length <= 20)"
          }
        },
        "board": {
          "$index": {
            ".validate": "$index.matches(/^[0-8]$/) && newData.isString() && (newData.parent().parent().child('game').val() === 'chess' ? newData.val() === '' : newData.val().matches(/^(x|o)?$/))"
          }
        },
        "game": {
          ".validate": "newData.isString() && newData.val().matches(/^(tic-tac-toe|chess)$/)"
        },
        "isPrivate": {
          ".validate": "newData.isBoolean()"
        },
        "hostUid": {
          ".validate": "newData.isString() && (newData.val() === data.val() || (!data.exists() && newData.val() === auth.uid && newData.parent().parent().child('players/x').val() === auth.uid))"
        },
        "fen": {
          ".validate": "newData.val() === null || (newData.isString() && newData.val().length <= 100)"
        },
        "pgn": {
          ".validate": "newData.val() === null || (newData.isString() && newData.val().length <= 20000)"
        },
        "turn": {
          ".validate": "newData.isString() && newData.val().matches(/^(x|o)$/)"
        },
        "status": {
          ".validate": "newData.isString() && newData.val().matches(/^(waiting|playing|won|draw)$/)"
        },
        "winner": {
          ".validate": "newData.val() === null || (newData.isString() && newData.val().matches(/^(x|o)$/))"
        },
        "createdAt": {
          ".validate": "newData.isNumber()"
        },
        "$other": {
          ".validate": false
        }
      }
    },
    "classroomPublicRooms": {
      ".read": "auth != null",
      "$roomCode": {
        ".write": "auth != null && (root.child('classroomRooms').child($roomCode).child('players/x').val() === auth.uid || root.child('classroomRooms').child($roomCode).child('players/o').val() === auth.uid) && (!newData.exists() || (root.child('classroomRooms').child($roomCode).child('status').val() === 'waiting' && root.child('classroomRooms').child($roomCode).child('isPrivate').val() !== true))",
        ".validate": "newData.hasChildren(['game', 'hostName', 'createdAt']) && newData.child('game').val().matches(/^(tic-tac-toe|chess)$/) && newData.child('hostName').isString() && newData.child('hostName').val().length <= 20 && newData.child('createdAt').isNumber()",
        "$other": {
          ".validate": false
        }
      }
    },
    "classroomRoomChats": {
      "$roomCode": {
        ".read": "auth != null && (root.child('classroomRooms').child($roomCode).child('players/x').val() === auth.uid || root.child('classroomRooms').child($roomCode).child('players/o').val() === auth.uid)",
        "$messageId": {
          ".write": "auth != null && !data.exists() && (root.child('classroomRooms').child($roomCode).child('players/x').val() === auth.uid || root.child('classroomRooms').child($roomCode).child('players/o').val() === auth.uid)",
          ".validate": "newData.hasChildren(['uid', 'name', 'text', 'createdAt']) && newData.child('uid').val() === auth.uid && newData.child('name').isString() && newData.child('name').val().length > 0 && newData.child('name').val().length <= 20 && newData.child('text').isString() && newData.child('text').val().length > 0 && newData.child('text').val().length <= 300 && newData.child('createdAt').isNumber()",
          "$other": {
            ".validate": false
          }
        }
      }
    },
    "messages": {
      ".read": "auth != null",
      "$messageId": {
        ".write": "auth != null && ((data.exists() && !newData.exists() && root.child('admins').child(auth.uid).val() === true) || (!data.exists() && newData.child('uid').val() === auth.uid && root.child('usernames').child(newData.child('nameKey').val()).val() === auth.uid && root.child('chatBans/users').child(auth.uid).val() != true && root.child('chatBans/names').child(newData.child('nameKey').val()).val() != true))",
        ".validate": "newData.hasChildren(['uid', 'name', 'nameKey', 'text', 'createdAt'])",
        "uid": {
          ".validate": "newData.isString() && newData.val() === auth.uid"
        },
        "name": {
          ".validate": "newData.isString() && newData.val().length >= 3 && newData.val().length <= 20 && newData.val().toLowerCase() === newData.parent().child('nameKey').val()"
        },
        "nameKey": {
          ".validate": "newData.isString() && newData.val().matches(/^[a-z0-9_]{3,20}$/) && root.child('usernames').child(newData.val()).val() === auth.uid"
        },
        "text": {
          ".validate": "newData.isString() && newData.val().length > 0 && newData.val().length <= 500"
        },
        "createdAt": {
          ".validate": "newData.isNumber() && newData.val() <= now && newData.val() > now - 60000"
        },
        "$other": {
          ".validate": false
        }
      }
    }
  }
}
```

7. Create or log into the account that should have admin access. In **Authentication > Users**, copy its UID. In **Realtime Database > Data**, add `admins/<uid>` with the Boolean value `true` (for example, `admins/abc123: true`). Only grant this to trusted accounts. The database rules prevent changes to admin access from the website; manage this allowlist in the Firebase console.

The admin control room's **Operations** tab can set or remove a shared site passcode. Publish the rules above for `siteControl/accessGate` before setting it. The passcode is stored as a salted PBKDF2 hash and visitors enter it once per tab session on the home page, arcade hub, and Multiplayer Board Games page. This is only a casual browser-side deterrent: GitHub Pages publishes all static files directly, and the Firebase client-readable hash can be guessed offline. It does not prevent direct access to the other game URLs, so don't use it to protect sensitive content. If the passcode is forgotten, an admin can remove `siteControl/accessGate` in the Firebase console.

The **Multiplayer Board Games** page supports Tic-Tac-Toe and chess, a live room chat, and a public directory of waiting rooms. Realtime Database rules must include `classroomRooms`, `classroomPublicRooms`, and `classroomRoomChats` as shown above; publish the complete rules before creating or joining rooms. Public rooms appear in the directory; rooms marked private are omitted and can only be joined by someone with their invite code or link (the code is an unlisted invite, not a security boundary). Each browser tab uses its own session-scoped Firebase identity, so opening the same room in another tab counts as the second player; reloading a tab keeps its identity for that tab session. The page uses the open-source [chess.js](https://github.com/jhlywa/chess.js) library for legal chess moves, with castling, en passant, promotion, check, checkmate, and draws including repetition. Room members can write the room state; this lightweight feature is not intended for sensitive or competitive games.

The admin control room can publish a site-wide theme and accent, set default theme and accent preferences for visitors who have not chosen a local theme, toggle confetti, send or clear an announcement, and request a refresh. It can be opened while a game is running. Refresh requests reload visitors who already have the updated arcade code open; users with older code, closed tabs, or offline browsers cannot be remotely refreshed. A force refresh may interrupt a game.
The **Fun** tab lets an admin launch a random game or trigger a one-off confetti burst in their current tab. Admins can also force a selected game for visitors with the current arcade page connected; this replaces any game they are currently playing in the arcade frame. Visitors with closed tabs, older code, or offline browsers are not affected.

The web config is public by design; never put a service-account key in this site. These rules let each Firebase UID reserve a case-insensitive username once, require that reservation for every new message, and limit profile access to its owner. Each message stores its Firebase UID, which you can match to the UID in **Authentication > Users** when moderating.

Chat does not require an account: visitors can choose a name and send messages as guests. Creating an account while signed in as a guest links that guest UID to an email and password, keeping an already-claimed username attached to the account. Later, log in with the same email and password to restore the saved name. An older guest identity can only be linked from the browser where that guest session still exists. Admins can delete messages, ban or unban users from message controls, and ban or unban usernames in the admin panel. These actions require the `chatBans` rules above. Bans use both Firebase UID and username; because guest identities are anonymous, a determined visitor may evade a UID-only ban by starting a new guest identity, so also ban the username. Admin announcements are sent to connected visitors and appear above the game iframe. Admins can also override visitor themes, accent colors, and confetti effects. This is a public room, so messages and usernames are visible to every visitor. For a larger public audience, add abuse reporting and server-enforced rate limits before opening the room widely.