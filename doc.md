GENERAL DESCRIPTION
The core mechanic, called “precision tapping” or a timed reflex challenge, is based on the visualization
of a digital stopwatch that oscillates at very high speed, usually between 0 and 99 milliseconds.
The match lasts from 00:00.00 to 01:00.00.
Each player has approximately 1 second to score a goal, without needing to be perfectly precise—they
may fall slightly short or slightly overshoot. That is, if the match starts at 00:00.00, the first player must stop
the stopwatch at 00:01.00 for the goal to be added to the scoreboard. The player may stop it a little before
or after, but never reach 00:01.98.
A player’s success is defined by their ability to process the visual signal and execute a touch command
within a millisecond-level window of opportunity, causing the counter to stop at an exact value. In the
game’s narrative, stopping the stopwatch at XX:XX.00 milliseconds translates directly into a goal.
However, the player also has the possibility of scoring from a free kick or a penalty.
Stopping the stopwatch at XX:XX.98 or XX:XX.02 results in a free kick. To take the free kick, the player
must select a number from 0 to 9, which corresponds to the milliseconds (the last digit of the stopwatch).
Once selected, if the actual precision matches the chosen number, it results in a goal.
Stopping the stopwatch at XX:XX.99 or XX:XX.01 results in a penalty. To take the penalty, the player
must choose between Even or Odd. If the final number matches the previously selected option, the result
is a goal. Any minimal numerical deviation outside the cases described above results in either a
goalkeeper save or a missed shot.
If, for any reason, Player 1 does not shoot before 1 second and 98 milliseconds, a corner kick is
awarded to Player 2 (and vice versa). The main stopwatch remains paused, and a second stopwatch
appears at the bottom of the screen starting at 00:00.00. This second stopwatch only appears during a
corner situation and disappears once the corner is taken.
To take the corner, the player must guess the last two digits of the stopwatch, having only 1 second to
do so (from 00:00.00 to 00:01.00). Once the two final digits (from 00 to 99) are selected, if they match the
player’s precision, the corner counts as a goal. In any case, once the corner ends and the second
stopwatch disappears, the same player retains their turn on the main stopwatch.
The game calculates an average of lost time and may add stoppage time once 01:00.00 is reached.
Stoppage time will never exceed 6 seconds (00:06.00). During stoppage time, the same rules apply as
during regular play, allowing the score to change until the very end.
POINT-BY-POINT DESCRIPTION

1. Core Game Concept
   The game is built around a mechanic called precision tapping, a timed reflex challenge.
   This means the player must stop a digital stopwatch at the exact right moment, with millisecond precision,
   in order to score goals.
   The key skill is not raw speed, but:
   • Seeing rapidly changing numbers
   • Processing visual information
   • Tapping at the exact instant
   The entire game revolves around stopping the stopwatch with precision.
2. Match Duration
   • The match starts at 00:00.00
   • Regulation time ends at 01:00.00 (exactly one minute)
   • Stoppage time may be added (explained later)
   • Throughout the match, players take turns attempting to score
3. Main Stopwatch
   • Displays seconds and milliseconds
   • Milliseconds oscillate rapidly between 00 and 99
   • Each player has approximately 1 second to make their attempt
   Example:
   If the stopwatch starts at 00:00.00, the player should aim to stop it close to 00:01.00.
   Important:
   • The player may stop slightly early or slightly late
   • They can never reach 00:01.98
   • Failing to act before this limit triggers a corner kick for the opponent
4. Outcomes When Stopping the Stopwatch
   Depending on the exact value where the stopwatch stops, different outcomes occur.
   4.1 Direct Goal (Maximum Precision)
   Stopping the stopwatch exactly at:
   XX:XX.00
   Results in a direct goal.
   Examples:
   • 00:01.00
   • 00:35.00
   No additional actions are required. The goal is immediately added to the scoreboard and play continues
   with the other player.
   4.2 Free Kick
   Stopping the stopwatch at:
   XX:XX.98 or XX:XX.02
   Awards a free kick.
   Free Kick Execution
   • The player selects a number from 0 to 9
   • This number represents the last millisecond digit
   • The stopwatch starts again
   • If the final digit matches the selected number → goal
   • If not → goalkeeper save or missed shot
   4.3 Penalty
   Stopping the stopwatch at:
   XX:XX.99 or XX:XX.01
   Awards a penalty kick.
   Penalty Execution
   • The player chooses Even or Odd
   • The stopwatch runs again
   • If the final number matches the choice → goal
   • Otherwise → missed penalty (saved or off target)
   4.4 Any Other Result
   Stopping the stopwatch at any other value:
   • Does not result in a goal
   • Is treated as a save or shot wide
5. Failure to Shoot on Time → Corner Kick
   If a player:
   • Does not stop the stopwatch
   • Exceeds 1 second and 98 milliseconds
   A corner kick is awarded to the opposing player.
6. Corner Kick Mechanic
   During a corner:
   • The main stopwatch is frozen
   • A second stopwatch appears at the bottom, starting at 00:00.00
   • This stopwatch is only visible during the corner
   Corner Execution
   • The player has 1 second (00:00.00–00:01.00)
   • The player must guess the last two digits (00–99)
   • If the guess matches exactly → corner goal
   • If not → no goal
   Important:
   After the corner:
   • The second stopwatch disappears
   • The same player continues their turn on the main stopwatch
7. Stoppage Time
   • Once 01:00.00 is reached, stoppage time may be added
   • Calculated based on time lost during the match
   • Never exceeds 6 seconds (00:06.00)
   • All normal rules apply
   • Goals can still be scored
   • The scoreboard may change until the final moment
8. Quick Summary
   • The game is about extreme stopwatch precision
   • Outcomes depend on exact milliseconds:
   o Direct goal
   o Free kick
   o Penalty
   o Miss
   • No action in time → corner kick
   • Corners have a unique precision mini-challenge
   • Match duration: 1 minute + stoppage time
   • Every millisecond matters
   SCREEN DESIGN EXPLANATION
9. Main Match Screen (Base Screen)
   This is the core screen of the game and is visible during most of the match. All actions originate here.
   1.1 Background and Atmosphere
   The background simulates a top-down view of a football pitch:
   • Green grass with subtle white pitch markings
   • Stadium-like atmosphere without distracting from the stopwatch
   • Static background to avoid interfering with time readability
   1.2 Main Stopwatch
   • Located at the upper center of the screen
   • Large and highly readable
   Format:
   MM:SS,MS
   Example: 00:37.42
   • Milliseconds (00–99):
   o Change at very high speed
   o Visually highlighted (slightly brighter or higher contrast)
   1.3 Action Button (Start / Stop)
   • Located at the bottom center of the screen
   • Shape: football (soccer ball)
   Function:
   • First tap → starts the stopwatch
   • Second tap → stops the stopwatch
   The ball may include:
   • Press animation
   • Subtle “impact” effect when stopping time
   1.4 Scoreboard
   • Located at the top, above the stopwatch
   • Displays:
   o Player 1 (left)
   o Player 2 (right)
   Visual format:
   P1 2 – 1 P2
   The scoreboard updates with:
   • Brief goal animation
   • Optional celebration sound
   1.5 Turn Indicator
   Small text or icon below the scoreboard:
   • “Player 1 Turn”
   • “Player 2 Turn”
   Automatically updates after each action.
10. Immediate Result Screens (Animated Text)
    Each time the player stops the stopwatch, animated text appears over the base screen without changing
    scenes.
    2.1 Direct Goal
    Large, centered text:
    “GOOOAL!”
    Animation:
    • Fast entry with bounce
    • Brief glow or flash
    Suggested color:
    • White or bright yellow
    Duration:
    • Short (1–1.5 seconds)
    2.2 Free Kick
    Animated text:
    “FREE KICK”
    Animation:
    • Lateral slide
    After the animation:
    • The free kick selection screen/tab opens
    2.3 Penalty
    Animated text:
    “PENALTY”
    Animation:
    • Zoom-in from center
    After the animation:
    • The penalty selection screen/tab opens
    2.4 Corner Kick
    Animated text:
    “CORNER”
    Animation:
    • Entry from a corner of the screen
    After the animation:
    • The corner screen with the second stopwatch opens
11. Free Kick Screen / Tab
    Displayed as an overlay tab, keeping the pitch background visible.
    3.1 Content
    Top text:
    “Select a number”
    Numeric selector:
    • Buttons from 0 to 9
    • Circular or rectangular layout
    • Selected number is visually highlighted
    3.2 Action
    Confirmation button:
    “Take Free Kick”
    Upon confirmation:
    • The tab disappears
    • The stopwatch resumes
    • The player must stop it with precision
    3.3 Result
    • If the last digit matches:
    o Animated text “GOOOAL!”
    • If not:
    o Animated text “SAVED” or “WIDE”
12. Penalty Screen / Tab
    Also displayed as an overlay tab.
    4.1 Content
    Text:
    “Choose an option”
    Two large buttons:
    • EVEN
    • ODD
    The selected option is visually highlighted.
    4.2 Action and Result
    Button: “Take Penalty”
    • Stopwatch starts
    • Player stops it
    Result shown with animated text:
    • “GOOOAL!”
    • “SAVED”
13. Corner Kick Screen
    This is a special screen with a slightly different layout.
    5.1 Stopwatch State
    • Main stopwatch is frozen
    • A second stopwatch appears:
    o Located at the bottom
    o Starts at 00:00.00
    o Visible only during the corner kick
    5.2 Number Selection
    Text:
    “Select the last two digits”
    Selector:
    • Two numeric fields (00–99)
    Possible input methods:
    • Numeric keypad
    • Number scroll
    Confirmation button:
    • “Take Corner”
    5.3 Execution
    • Second stopwatch runs for up to 1 second
    • Player stops it
    Result:
    • Exact match → “CORNER GOAL!”
    • Miss → “CLEARED”
    5.4 Return to Play
    • Second stopwatch disappears
    • Same player continues their turn on the main stopwatch
14. Stoppage Time Screen State
    Not a separate screen, but a visual state of the match.
    6.1 Indicator
    Text below the stopwatch:
    “+ 00:04.00”
    Displayed in a different color (e.g., yellow).
    6.2 Behavior
    • Stopwatch continues running
    • All game rules remain active
    • All event screens remain available:
    o Goal
    o Free Kick
    o Penalty
    o Corner Kick
15. End of Match Screen
    7.1 Content
    Centered text:
    “FULL TIME”
    Large final scoreboard.
    Message:
    • “Player 1 Wins” if Player 1 wins
    • “Player 2 Wins” if Player 2 wins
    • “Penalty Shootout” if tied
    In case of a draw, players must play a best-of-five penalty shootout, ensuring there is always a winner.
    7.2 Post-Match Actions
    Buttons:
    • “Rematch”
    • “Exit”
    Players have 20 seconds to choose a rematch; otherwise, both leave the room.
16. Visual Flow Summary
    Main Screen → Start Stopwatch
    Stop Stopwatch
    Animated result text
    If special event → Selection tab
    Goal attempt
    Scoreboard update
    Turn change or continuation
17. Main Menu Screen (Game Mode Selection)
    Before entering a match, the player must choose the game mode.
    9.1 Main Options
    Large buttons displayed in the main menu:
    • Quick Match (Casual)
    • Ranked Mode
    • Shop / Customization (future)
    • How to Play
18. Ranked Screen (Player Ranking)
    Displays the player’s current division and progress.
    10.1 Current Division
    Top section:
    Text:
    “Your Division”
    Badge or icon showing the division name.
    Division Name
    1 Legend
    2 Champion
    3 Professional
    4 Expert
    5 Advanced
    6 Competitor
    7 Amateur
    8 Novice
    9 Beginner
    10 Rookie
    Example:
    Division 6 – Competitor
    10.2 Ranking Points (RP) Bar
    Progress bar displayed below the division.
    Example:
    RP: 540 / 600
    Each division spans 100 points:
    • Division 10 → 0–99
    • Division 9 → 100–199
    • …
    • Division 1 → 900–999
    10.3 Quick Stats
    Optional display:
    • Ranked matches won
    • Current win streak
    • Highest division achieved
    10.4 Main Button
    Large button:
    “Play Ranked”
19. Ranked Matchmaking Screen
    When the player taps “Play Ranked”, the game begins searching for an opponent.
    11.1 Content
    Centered text:
    “Searching for opponent…”
    Animated loading indicator.
    Current division displayed:
    Example:
    “Division 6 – Competitor”
    11.2 Fair Matchmaking
    The system searches for opponents with similar skill levels:
    • First, players in the same division
    • If matchmaking takes longer, the search range expands gradually
    The system will never match:
    • Division 1 vs Division 10
    This ensures fair and competitive matches.
    11.3 Cancel Option
    Bottom button:
    “Cancel Search”
20. Ranked Match Result Screen
    At the end of a Ranked match, in addition to the final score, ranking point changes are
    displayed.
    12.1 Expanded End Screen
    Along with:
    • “FULL TIME”
    • Final scoreboard
    • Win / Loss result
    The following information is added:
    12.2 RP Gain or Loss
    Highlighted text:
    If the player wins:
    • +25 RP
    If the player loses:
    • –20 RP
    (Values can be adjusted for balance.)
    12.3 Promotion or Relegation
    If a division threshold is crossed:
    Animated text:
    • PROMOTION! New Division: Advanced
    Or, in case of relegation:
    • Relegated to Division 7 – Amateur
    12.4 Promotion Shield
    When a player is promoted, they receive a protection bonus:
    “Shield x2”
    This means:
    • The player can lose two matches without being immediately relegated
    This helps promotions feel rewarding rather than punishing.
    12.5 Final Buttons
    • “Play Another Ranked”
    • “Back to Menu”
21. Ranked Seasons (Optional – Future Feature)
    Ranked Mode can operate in seasons.
    Recommended duration:
    • 2 weeks or 1 month
    At the end of each season:
    • Rewards are granted based on the highest division reached
    Reward Examples
    • Legend → Exclusive skin + badge
    • Champion / Professional → Epic skin
    • Mid divisions → Coins
    • Lower divisions → Basic reward
    After the season ends:
    • Partial RP reset to maintain competitiveness
22. Ranked Flow Summary
    Main Menu → Select Ranked
    Ranked Screen → View Division & RP
    Tap “Play Ranked”
    Matchmaking → Find balanced opponent
    Standard Match (Stopwatch + Events)
    End of Match
    RP Gain / Loss Screen
    Possible Promotion / Relegation
    Rematch or Return to Menu
    RANKED MODE – FULL EXPLANATION
    The goal is to provide a competitive online mode where players move up or down divisions based on
    performance.
    There are 10 divisions, ranging from beginners to the best players in the game.
    Game Divisions
    The 10 divisions, from lowest to highest:
    Division Name Skill Level
    Division 10 Rookie New players
    Division 9 Beginner First steps
    Division 8 Novice Understands the game
    Division 7 Amateur Basic competitive level
    Division 6 Competitor Average player
    Division 5 Advanced Starting to stand out
    Division 4 Expert Very strong
    Division 3 Professional High-level players
    Division 2 Champion Top-tier
    Division 1 Legend Best players
    Player Objective: steadily climb the ranks until reaching Legend (Division 1).
    Ranking Points System (RP)
    Each player has an internal score called Ranking Points (RP).
    • Win → gain RP
    • Loss → lose RP
    When a player reaches certain RP thresholds, they move up or down divisions.
    RP Ranges per Division
    Each division covers a fixed RP range:
    • Division 10: 0–99 RP
    • Division 9: 100–199 RP
    • Division 8: 200–299 RP
    • …
    • Division 1: 900–999 RP
    This creates a clear and understandable progression.
    Winning Against Stronger Opponents Is Worth More
    Not all wins and losses are equal:
    • Beating an opponent of the same level → normal RP gain
    • Beating a stronger opponent → higher RP gain
    • Losing to a weaker opponent → higher RP loss
    This allows skilled players to climb faster and prevents stagnation in lower divisions.
    Fair Matchmaking Philosophy
    When entering Ranked:
    • The system prioritizes opponents in the same division or with similar RP
    • Example:
    o A Division 6 player typically faces Division 5, 6, or 7 opponents
    This avoids unfair matches such as:
    • Division 1 vs Division 10
    Promotion and Relegation
    Promotion
    When a player earns enough RP:
    • They are automatically promoted to the next division
    Example:
    • From Amateur (Division 7)
    • To Competitor (Division 6)
    Relegation
    If a player loses too many matches:
    • They are relegated to a lower division
    Example:
    • From Expert (Division 4)
    • To Advanced (Division 5)
    Promotion Shield
    To reduce frustration:
    • Upon promotion, the player receives a two-loss protection shield
    This means:
    • Losing immediately after promotion does not cause instant relegation
    Promotion feels like an achievement, not a risk.
    Placement Matches (New Players)
    New players must complete approximately 10 placement matches.
    Purpose:
    • Quickly determine player skill level
    Outcomes:
    • Highly skilled players move rapidly to higher divisions
    • New or casual players remain in lower divisions
    This prevents experienced players from overwhelming beginners.
    Seasons and Rewards
    Ranked operates in seasonal cycles.
    At the end of a season:
    • Players receive rewards based on their highest achieved division
    Example rewards:
    • Legend → Exclusive skin + badge
    • Champion / Professional → Epic skin
    • Mid divisions → Coins
    • Lower divisions → Basic reward
    Afterwards:
    • Partial RP reset ensures ongoing competition
    Final Summary
    Ranked Mode ensures that:
    • Players compete against others of similar skill
    • Progression feels fair and rewarding
    • The best players rise to Legend
    • Seasonal rewards keep motivation high
