---
lang: en
title: Typing the technical interview
---

*Previously: [Hexing the technical interview].*

In the formless days, long before the rise of the Church, all spells were woven of pure causality, all actions were permitted, and death was common. Many witches were disfigured by their magicks, found crumpled at the center of a circle of twisted, glass-eaten trees, and stones which burned unceasing in the pooling water; some disappeared entirely, or wandered along the ridgetops: feet never touching earth, breath never warming air.

As a child, you learned the story of Gullveig-then-Heiðr, reborn three times from the fires of her trial, who traveled the world performing *seidr*: the reading and re-weaving of the future. Her foretellings (and there were many) were famed—spoken of even by the völva-beyond-the-world—but it was her *survival* that changed history. Through the ecstatic trance of *seidr*, she foresaw her fate, and conquered death. Her spells would never crash, and she became a friend to outcast women: the predecessors of your kind. It is said that Odin himself learned immortality from her.

To this day, all witches owe Heiðr a debt. Few delve into the ancient, unstructured magic nowadays. The very languages in which your spells are written are stabilized with *seidr* in their syntax, channeling the energies you summon through safe paths—more or less. There are still occasional explosions, of course. They’re just… more of the eyebrow-singeing variety, than the type that result in new and interestingly-shaped fjørds.

“Is everything all right?”

The interviewer—Criss, his badge says—is young, as is customary in the Valley. Wearing a hoodie which, judging from the lack of branding, cost at least three hundred dollars. He resembles no animal in particular, which gives you pause. Usually you’re better at that sort of thing.

“Do you mean in general? I don’t think so.” You look around at the conference room as if to confirm. The walls smell of Slack DMs and conflict avoidance.

“Ah, well, um. Yes, you’re probably right.” He sounds bashful. “But I’d like to do a little exercise with you nonetheless. Just a simple programming puzzle, so I can understand how you solve problems.”

Once, you solved a problem with a knife of shattered sky-glass. You wonder whether Criss would have the strength to do what you have done.

“Sooo… this problem is called N-Queens, and it’s fairly simple. Given an NxN chessboard, you need to find a way to place N queens on that board safely.”

You draw an eight-by-eight grid on the whiteboard, and neatly arrange eight queens together in the center. They face each other in a tight circle, to converse as equals.

“Er, no—that’s not right. See? This queen could kill any of these four, in one move.”

“Are you really unable,” you ask, voice as calm as stone, “to imagine eight powerful women in the same room without them trying to kill each other?”

“It’s… it’s just how the problem works.”

Perhaps they are the matriarchs of warring clans, then. Together to discuss a truce—but none trusting the other within a dagger’s reach. This too has happened, in the history of your kind.

“Can I use any language?”

“Sure.”

Move quickly, before he realizes his mistake.

    {-# OPTIONS_GHC -fno-warn-missing-methods #-}
    {-# LANGUAGE MultiParamTypeClasses #-}
    {-# LANGUAGE FunctionalDependencies #-}
    {-# LANGUAGE FlexibleInstances #-}
    {-# LANGUAGE UndecidableInstances #-}

“Oh, this is Haskell! I studied this in college!” He pauses, and frowns. “Undecidable instances?”

“We must use this,” you inform him cheerfully, “because Hask is not a category.”

“Oh, right.” He blusters a non-termination argument at nobody in particular. “That’s why we usually think in subsets of Haskell where types don’t have bottom values.”

“You could do that,” you concur, but, so quietly he cannot hear you, continue to believe the exact opposite.

`nil = undefined`

An uncomfortable question is coming. Head it off by blurting out the first thing that comes to mind. “To store our queen positions, we’ll need some kind of a linked list, right?”

“Sure, or a vector.”

“Lists are simpler.”

“OK, sure. Whatever floats your boat.”

Summon a linked list from the void. It floats to the surface of the screen: a timeless structure, expressed a thousand ways, but always beautiful. You sigh contentedly.

    data Nil
    data Cons x xs

“Couldn’t you use the built-in lists?” Criss asks, his brow furrowing.

“What?” You have no idea what he’s talking about. “Oh, no—not without pulling in a library. It’s easier to just define it inline.”

    class First list x | list -> x
    instance First Nil Nil
    instance First (Cons x more) x

“The ‘class’ keyword defines a function signature,” you remind Criss, who seems to have forgotten something. “First takes a list and returns a value x from it. There are two instances of our function—Haskell uses pattern matching to choose which to call. First on a Nil list returns Nil, and First on a Cons cell returns that cell’s value, x.”

You let that sink in, and move to concatenating two lists together.

    class ListConcat a b c | a b -> c
    instance ListConcat Nil x x
    instance (ListConcat as bs cs)
      => ListConcat (Cons a as) bs (Cons a cs)

“What’s the arrow?” Criss asks. Tell him it means implication. “To obtain the ListConcat after the arrow, we *need* the ListConcat before the arrow.”

Realization dawns. “Oh, right! This is recursion, because ListConcat appears in both positions. And the definition for Nil is the base case.”

“Exactly.” You’re so proud of Criss. He’s coming right along. “And here’s the generalized case, when we want to concatenate a list of lists.”

    -- Concatenate all lists in a list
    class ListConcatAll ls l | ls -> l
    instance ListConcatAll Nil Nil
    instance (ListConcat chunk acc result,
              ListConcatAll rest acc)
      => ListConcatAll (Cons chunk rest) result

    -- Is any element of this list True?
    class AnyTrue list t | list -> t
    instance AnyTrue Nil              False
    instance AnyTrue (Cons True more) True
    instance (AnyTrue list t)
      => AnyTrue (Cons False list) t

This has required more concentration than you would have liked, so you back off to something easier. “Let’s do booleans,” you suggest, as if inviting him to lunch.

“Why?”

“Because we need them, of course.”

Seize two meaningless constants from the void, and imbue them with meaning.

``` vb
data True
data False

class Not b1 b | b1 -> b
instance Not False True
instance Not True  False

class Or b1 b2 b | b1 b2 -> b
instance Or True  True  True
instance Or True  False True
instance Or False True  True
instance Or False False False
```

Freyja would be pleased. To birth an algebra into the world is a beautiful thing.

“And I suppose we’ll need integral numbers to store the positions of our queens as well,” you mutter. “We’ll work in positive coordinates only, so the usual Peano construction should suffice.” Draw a thread of hair from your head, and tie a knot in it for zero.

    data Z
    data S n

    type N0 = Z
    type N1 = S N0
    type N2 = S N1
    type N3 = S N2
    type N4 = S N3
    type N5 = S N4
    type N6 = S N5
    type N7 = S N6
    type N8 = S N7

“You’re… defining the natural numbers by hand? Why?”

“Haskell is for mathematicians,” you explain. “We always define our terms.”

``` haskell
-- Equality
class PeanoEqual a b t | a b -> t
instance PeanoEqual Z     Z     True
instance PeanoEqual (S a) Z     False
instance PeanoEqual Z     (S b) False
instance (PeanoEqual a b t)
  => PeanoEqual (S a) (S b) t

-- Comparison (<)
class PeanoLT a b t | a b -> t
instance PeanoLT Z      Z     False
instance PeanoLT (S x)  Z     False
instance PeanoLT Z      (S x) True
instance (PeanoLT a b t)
  => PeanoLT (S a) (S b) t

-- Absolute difference
class PeanoAbsDiff a b c | a b -> c
instance PeanoAbsDiff Z Z Z
instance PeanoAbsDiff Z (S b) (S b)
instance PeanoAbsDiff (S a) Z (S a)
instance (PeanoAbsDiff a b c)
  => PeanoAbsDiff (S a) (S b) c

-- Integers from n to 0
class Range n xs | n -> xs
instance Range Z Nil
instance (Range n xs)
  => Range (S n) (Cons n xs)
```

“Wait, hang on,” Criss interrupts. “Shouldn’t you… shouldn’t there be type declarations here? At least on our functions?”

You smile kindly. “Haskell is a dynamically-typed, interpreted language.”

Criss appears to have swallowed a frog.

“Here, I’ll show you. Let’s check if one equals one.”

    class LegalCompare t | -> t
      where legalCompare :: t
    instance (PeanoEqual (S Z) (S Z) t)
      => LegalCompare t

    *Main> :type legalCompare
    legalCompare :: True

“See? `legalCompare` is equal to `True`. Now let’s try writing an expression that performs an invalid comparison. Say, comparing True to a List?”

    class IllegalCompare t | -> t
      where illegalCompare :: t
    instance (PeanoEqual True (Cons Z False) t)
      => IllegalCompare t

“See? It loads just fine. It only breaks when you try to *evaluate* it—remember, Haskell is lazy.”

    *Main> :type illegalCompare
    illegalCompare :: PeanoEqual True (Cons Z False) t => t

“There you have it! A runtime type error.”

“It doesn’t *say* error…”

“Well, you know. Haskell’s error messages are notoriously difficult to understand.”

Criss appears quite ill. Take the opportunity to move on to higher order functions.

“Unfortunately, Haskell has no currying, so we’re forced to build our own tools for partial functions. Here’s a signature for generalized single-arity function application.”

`class Apply f a r | f a -> r`

“Just a function f which takes input a and returns r.” The variables have a lovely songlike melody. “For partial application, we could define datatypes like Partial1, Partial2, etc, but since we only need a few of these, it’s easier to define explicitly curried versions of the functions we need. Like so!”

    data Conj1 list
    instance Apply (Conj1 list) x (Cons x list)

Breathe deep, and allow your spirit to come unmoored from these concrete forms, ascending to the plane of higher order functions.

``` haskell
-- Map f over a list
class Map f xs ys | f xs -> ys
instance Map f Nil Nil
instance (Apply f x y, Map f xs ys)
  => Map f (Cons x xs) (Cons y ys)

-- Map f over list and concatenate results together
class MapCat f xs zs | f xs -> zs
instance MapCat f Nil Nil
instance (Map f xs chunks, ListConcatAll chunks ys)
  => MapCat f xs ys

-- Filter a list with an Apply-able predicate function
class AppendIf pred x ys zs | pred x ys -> zs
instance AppendIf True x ys (Cons x ys)
instance AppendIf False x ys ys

class Filter f xs ys | f xs -> ys
instance Filter f Nil Nil
instance (Apply f x t,
          Filter f xs ys,
          AppendIf t x ys zs)
  => Filter f (Cons x xs) zs
```

Check back in with the world of concrete values for a moment. Criss is still here, at least physically. Your laptop screen has turned a gorgeous mix of purples, owing to the extreme cold, but the code is still dimly visible within. It reminds you of a frozen lake at dusk. A liquid crystal.

“Criss. Criss.” He blinks rapidly, as if coming out of darkness. Such beautiful eyes. You remember when your own still held color. “We’re ready.”

“Yes. Right.”

“A queen is defined by her two coordinates on the board: x and y. We’ll also build a partially applied constructor for making queens with a given x coordinate.”

    data Queen x y
    data Queen1 x
    instance Apply (Queen1 x) y (Queen x y)

    -- A list of queens in row x with y from 0 to n.
    class QueensInRow n x queens | n x -> queens
    instance (Range n ys, Map (Queen1 x) ys queens)
      => QueensInRow n x queens

“Yes queens!” You murmur. This is, sadly, not that kind of interview.

These queens can stab in eight directions. You always assumed that was a metaphor.

    -- Does queen a threaten queen b?
    class Threatens a b t | a b -> t
    instance (PeanoEqual ax bx xeq,
              PeanoEqual ay by yeq,
              Or xeq yeq xyeq,
              PeanoAbsDiff ax bx dx,
              PeanoAbsDiff ay by dy,
              PeanoEqual dx dy deq,
              Or xyeq deq res)
      => Threatens (Queen ax ay) (Queen bx by) res

    -- Partial application of Threatens
    data Threatens1 a
    instance (Threatens a b t)
      => Apply (Threatens1 a) b t

A new queen enters the room, striding into position. She watches her adversaries warily, remaining just out of reach. Where can she stand? You envision a stack of universes—alternate worlds, each containing queens in various positions.

``` haskell
-- Is queen b compatible with all queen as?
class Safe config queen t | config queen -> t
instance (Map (Threatens1 queen) config m1,
          AnyTrue m1 t1,
          Not     t1 t2)
  => Safe config queen t2

data Safe1 config
instance (Safe config queen t)
  => Apply (Safe1 config) queen t

-- Add a queen with the given x coordinate to a legal configuration, returning
-- a set of legal configurations.
class AddQueen n x c cs | n x c -> cs
instance (QueensInRow n x candidates,
          Filter (Safe1 c) candidates filtered,
          Map (Conj1 c) filtered cs)
  => AddQueen n x c cs

data AddQueen2 n x
instance (AddQueen n x c cs)
  => Apply (AddQueen2 n x) c cs

-- Add a queen at x to every configuration, returning a set of legal
-- configurations.
class AddQueenToAll n x cs cs' | n x cs -> cs'
instance (MapCat (AddQueen2 n x) cs cs')
  => AddQueenToAll n x cs cs'
```

“And now, we recur,” you whisper, and loop the spell back on itself, sewn together with the thread of control. One queen per row, in every legal position, for every configuration. You imagine what their startup’s about-us page would look like.

``` haskell
-- Add queens recursively
class AddQueensIf pred n x cs cs' | pred n x cs -> cs'
instance AddQueensIf False n x cs cs
instance (AddQueenToAll n x cs cs2,
          AddQueens n (S x) cs2 cs')
  => AddQueensIf True n x cs cs'

class AddQueens n x cs cs' | n x cs -> cs'
instance (PeanoLT x n pred,
          AddQueensIf pred n x cs cs')
  => AddQueens n x cs cs'

-- Solve
class Solution n c | n -> c where
  solution :: n -> c
instance (AddQueens n Z (Cons Nil Nil) cs,
          First cs c)
  => Solution n c where solution = nil
```

Criss has adopted the far-gaze of a man who has learned of some great loss, or perhaps been witness to a nearby explosion. Take his shoulder gently. “Psst!” You whisper. “All is prepared, and a solution is at hand.”

    *Main> :type solution (nil :: N6)
    solution (nil :: N6)
      :: Cons (Queen (S (S (S (S (S Z))))) (S Z))
           (Cons (Queen (S (S (S (S Z)))) (S (S (S Z))))
              (Cons (Queen (S (S (S Z))) (S (S (S (S (S Z))))))
                 (Cons (Queen (S (S Z)) Z)
                    (Cons (Queen (S Z) (S (S Z)))
                       (Cons (Queen Z (S (S (S (S Z)))))
                          Nil)))))

Look: the pretty-printer has aligned things *just so*, creating a lovely line of zeroes along the vertical axis. “So that’s a queen at 5,1, at 4,3, at 3,5, at 2,0, 1,2, and 0,4. Does that work, Criss?”

Criss stares at you for a long, long moment. “You never… you never wrote an actual *value*. You… do realize that the type system is meant to constrain *values*, right?”

“No,” you inform him, matter-of-factly. “No, that doesn’t sound right.”

He leans back in his chair, so far you think he may fall over, and rubs his forehead with both hands. You, who through *seidr*, have seen your rejection email already, know what he is about to say.

“We’ll be in touch.”

*With sincerest thanks to [Patrick Thomson], and Conrad Parker’s [Type Level Instant Insanity].*

  [Hexing the technical interview]: https://aphyr.com/posts/341-hexing-the-technical-interview
  [Patrick Thomson]: https://twitter.com/importantshock
  [Type Level Instant Insanity]: https://wiki.haskell.org/wikiupload/d/dd/TMR-Issue8.pdf
