import { Rocket, Wrench, Trophy, ShieldCheck, Smartphone, Coins } from 'lucide-react';
import { RESOLVED_ISSUES, OPEN_ISSUES } from '@/lib/journey';

/**
 * BAK55 EDITORIAL POLICY
 *
 * 1. Only real BAK55 updates are published here. No AI-written filler, no invented
 *    artist stories, no fabricated interviews, quotes, statistics or case studies.
 * 2. Every post describes something that actually happened on this platform, written
 *    by the team, dated with the day it happened.
 * 3. If a number appears in a post it must come from our own database, and it must be
 *    stated as of a date.
 * 4. When we get something wrong, we say so in the post rather than deleting it.
 */

export interface BlogPost {
  id: number;
  title: string;
  image?: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  icon: typeof Rocket;
  content: string[];
}

export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: 'What We Are Still Working On',
    excerpt:
      'An honest list of the parts of BAK55 that are not finished yet, why they are not finished, and what we intend to do about them.',
    category: 'Progress Update',
    date: '2026-07-20',
    readTime: '4 min read',
    icon: Wrench,
    content: [
      'We would rather tell you what is unfinished than let you find out on your own. This is the current list, and we update it whenever something moves.',
      ...OPEN_ISSUES.map(
        (issue) => `${issue.title} — ${issue.description} Where we are going: ${issue.expected} (roughly ${issue.progress}% of the way there.)`
      ),
      'None of these have a promised delivery date, because we have learned that dates we cannot keep do more damage than an honest "not yet". When any of these ship, they will appear in the change log with the date they went live.',
    ],
  },
  {
    id: 2,
    title: 'Bugs We Found in Beta, and How We Fixed Them',
    excerpt:
      'Wallet balances that would not refresh, inflated play counts, duplicate votes, unusable mobile dialogs. What actually broke during beta and what we changed.',
    category: 'Engineering',
    date: '2026-06-01',
    readTime: '6 min read',
    icon: ShieldCheck,
    content: [
      'Beta exists so that real usage can find the problems that testing does not. It did. Here is the record of what broke, what caused it, and what we changed — written the way we would want it written if we were the artists affected.',
      ...RESOLVED_ISSUES.map(
        (issue) => `${issue.problem} Cause: ${issue.cause} Fix: ${issue.solution}`
      ),
      'Two things we took from this. First, money must never be handled in more than one place — every balance change on BAK55 now goes through a single locked database transaction. Second, a vague error message is its own bug; if we cannot tell you what went wrong, we have not finished the feature.',
      'If you hit something that is not on this list, report it. Bugs reported by artists get fixed faster than bugs we find ourselves, because you tell us what you were actually trying to do.',
    ],
  },
  {
    id: 3,
    title: 'How Voting and Scoring Actually Work',
    excerpt:
      'The scoring formula, the fee split, the self-vote cap and the fraud review window — written out in full so nothing about a result is a surprise.',
    category: 'Transparency',
    date: '2026-04-15',
    readTime: '5 min read',
    icon: Trophy,
    content: [
      'A competition is only worth entering if the rules are knowable in advance. These are ours, in full.',
      'Final score. A submission is scored 70% on fan votes and 30% on AI assessment. The AI portion looks at recording quality, performance, songwriting and originality, and its breakdown is shown publicly on each submission.',
      'Votes cost coins. Fans spend BAKCoins to vote, and the split of where that money goes is displayed before the spend is confirmed, not after. Every vote produces a receipt with a vote ID you can look up.',
      'Self-voting. Artists may vote for their own submission at the normal coin cost, capped at 10 self-votes per day. Repeat voting by fans is allowed and deliberate — support should be able to accumulate.',
      'Fraud review. Prize settlement is held for 7 days after a competition closes. In that window suspicious votes can be invalidated and the standings corrected. It is better to pay a week late than to pay the wrong person.',
      'Manual overrides. If a result has to be changed by hand, two separate administrators must sign off and the action is written to the public audit log. There is no path for one person to quietly change a winner.',
      'If we change any of this, the change appears in the public change log with a date, and material changes are announced before they take effect.',
    ],
  },
  {
    id: 4,
    title: 'Rebuilding BAK55 for the Phone',
    excerpt:
      'Almost everyone uses BAK55 on a phone. The first version was not built that way. Here is what we changed.',
    category: 'Product',
    date: '2026-06-01',
    readTime: '4 min read',
    icon: Smartphone,
    content: [
      'The first version of BAK55 was designed on a laptop. Our users are not on laptops. Dialogs were getting cut off behind browser chrome, buttons were too small to hit accurately, and forms brought up the wrong keyboard.',
      'What changed: modal dialogs became bottom sheets that slide up from the thumb, with safe-area padding so nothing hides behind the home indicator. Tap targets have a minimum size. Number fields open a number pad and phone fields open a phone pad. The player sits above the bottom navigation instead of on top of it.',
      'Flows that involve money — voting, tipping, buying coins, withdrawing — now show a review step with the exact fee split before anything is confirmed, and a receipt afterwards.',
      'This was not a redesign for its own sake. It came out of watching people fail to complete a vote on a mid-range Android phone.',
    ],
  },
  {
    id: 5,
    title: 'How BAKCoins Work, and Why We Use Them',
    excerpt:
      'One BAKCoin is $0.16. Here is exactly where the money goes when a fan votes, tips, or buys a track.',
    category: 'Economy',
    date: '2026-03-02',
    readTime: '4 min read',
    icon: Coins,
    content: [
      'BAKCoins exist for one reason: micro-support. Sending an artist the equivalent of a few shillings through a card processor costs more in fees than the support itself is worth. Batching value into coins makes small, frequent support possible.',
      'One BAKCoin is $0.16. Coins are bought once, then spent as many times as you like across voting, tipping, subscriptions and track purchases.',
      'Where the money goes is published per action, and shown before you spend. Tips under 50 BAK carry no platform fee at all. Beat licensing splits 85% to the producer. Withdrawals carry a 5% processing fee with a 250 BAK minimum.',
      'Artists withdraw to M-Pesa. Withdrawal requires identity verification and a level requirement, which exists to stop payout fraud rather than to hold anyone\'s money.',
      'We publish these numbers because a platform that will not tell you its cut has usually decided you would not like the answer.',
    ],
  },
  {
    id: 6,
    title: 'BAK55 Is Open: What the Beta Actually Is',
    excerpt:
      'We opened the platform in October 2025 with streaming, uploads and a wallet. This is what exists today and what does not.',
    category: 'Announcement',
    date: '2025-10-07',
    readTime: '3 min read',
    icon: Rocket,
    content: [
      'BAK55 opened to the public on 7 October 2025. On day one you could create an account, register as an artist, upload a track, listen to the catalog and hold a BAKCoins wallet. That was the whole of it.',
      'We are building this from Nairobi, for artists in this region, because the platforms that already exist were not designed with a Kenyan artist\'s economics in mind.',
      'What is real today: artist profiles, streaming, a working wallet, competitions with fan voting, direct tipping, beat licensing, fan subscriptions and payouts to M-Pesa.',
      'What is not real yet: we do not have a large catalog, we are not a distributor, and we have not yet run a full competition season end to end. Any number you see on this site comes from our own database and reflects exactly where we are.',
      'If you are an artist reading this early, you are early. That is the honest pitch.',
    ],
  },
];
