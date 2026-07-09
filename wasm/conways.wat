(module
    ;; we're importing this memory just in case idk lol
    ;; we're using states here as an array of bytes where each byte represents the state of each cell (therefore states must be at least $cellWidth*$cellHeight bytes long)
	;; multi memory :eyes:
    (import "global" "prevStates" (memory $prevStates 1))
    (import "global" "states" (memory $states 1))
    (;import "global" "cellWidth" (global $cellWidth i32))
    (import "global" "cellHeight" (global $cellHeight i32);)
    (import "global" "cellWH" (global $cellWH i32))
    (import "global" "cellWH2" (global $cellWH2 i32))
    (import "global" "log" (func $log2 (param i32 i32))) ;; hell yeah!
    (import "global" "log" (func $log (param i32)))
    ;; (func (export "debug")
    ;;     ;; nevermind i just remembered we can import globals lol
    ;;     (;param $cellWidth i32)
    ;;     (param $cellHeight i32;)
    ;;
    ;;     ;; here's the function where we'll calculate the states of all cells
    ;;     global.get $cellWidth
    ;;     global.get $cellHeight
    ;;     call $log2
    ;;     ;; fancy folded expressions $$$
    ;;     (i32.mul
    ;;         (global.get $cellWidth)
    ;;         (global.get $cellHeight)
    ;;     )
    ;;     call $log
    ;; )
    (func $getNeighbors (export "getNeighbors") (param $x i32) (param $y i32) (result i32)
        (local $i i32)
        (local $j i32)
        (local $newX i32)
        (local $newY i32)
        (local $result i32)
        i32.const -1
        local.set $i
        (loop $fori
            i32.const -1
            local.set $j
            (loop $forj
                local.get $x
                local.get $i
                i32.add
                ;; altered x at bottom of operand stack
                ;; uh oh wait what if ts is out of bounds!! (i've actually never implemented the wrap around until now and i only did it because it was easier than branching out of this loop. (we'd have to use a block and branch to it (which i just learned after i wrote this entire thing)))
                ;; aw man we're gonna need another local variable since eq pops that shit
                local.tee $newX
                i32.const 0
                i32.lt_s
                (if (result i32) ;; if $newX < 0
                    (then
                        global.get $cellWH
                        local.get $newX
                        i32.add
                        local.tee $newX
                    )
                    (else
                        local.get $newX
                    )
                )
                global.get $cellWH
                i32.ge_s
                (if (result i32) ;; if $newX >= $cellWH
                    (then
                        local.get $newX
                        global.get $cellWH
                        i32.sub
                        ;; we won't need to update $newX anymore since we'll just leave the result on the operand stack
                        ;; local.tee $newX
                    )
                    (else
                        local.get $newX
                    )
                )

                ;; corrected x on operand stack

                local.get $y
                local.get $j
                i32.add

                local.tee $newY
                i32.const 0
                i32.lt_s
                (if (result i32) ;; if $newY < 0
                    (then
                        global.get $cellWH
                        local.get $newY
                        i32.add
                        local.tee $newY
                    )
                    (else
                        local.get $newY
                    )
                )
                
                global.get $cellWH
                i32.ge_s
                (if (result i32) ;; if $newY >= $cellWH
                    (then
                        local.get $newY
                        global.get $cellWH
                        i32.sub
                        ;; we won't need to update $newY anymore since we'll just leave the result on the operand stack
                        ;; local.tee $newY
                    )
                    (else
                        local.get $newY
                    )
                )
                
                ;; corrected y at top of operand stack
                
                global.get $cellWH
                i32.mul
                ;; altered y at top of operand stack

                i32.add                 ;; operand stack = ((y + j)*$cellWH + (x + i))

                i32.load8_u (memory $prevStates) ;; operand stack = state[(y + j)*$cellWH + (x + i))]

                local.get $result
                i32.add

                local.set $result

                local.get $j
                i32.const 1
                i32.add
                local.tee $j
                i32.const 2
                i32.ne
                br_if $forj
            )
            local.get $i
            i32.const 1
            i32.add
            local.tee $i
            i32.const 2
            i32.ne
            br_if $fori
        )
        local.get $result
        local.get $x
        local.get $y
        global.get $cellWH
        i32.mul                         ;; $y * $cellWH
        i32.add                         ;; $x + ($y * $cellWH)
        i32.load8_u                     ;; states[$x + ($y * $cellWH)]
        i32.sub                         ;; result = $result - states[$x + ($y * $cellWH)] ;; we're subtracting the state at $x, $y because that's not supposed to be in the calculation lol!
    )
    (func (export "tick")
        (local $counter i32)
        ;;(local $ourPrevState i32)
        (local $neighbors i32)
        (local $tempAliveOrNotFuck i32)
        ;;(local $cellWH)
        ;;global.get $cellWidth
        ;;global.get $cellHeight
        ;;i32.mul
        ;;;; local.set $cellWH
        ;;local.tee $cellWH
        
        (;global.get $cellWH
        global.get $cellWH2
        call $log2;)

        (loop $loop
            ;; yo how am i gonna do modulo
            ;; x = $counter % $cellWidth
            ;; oh it's rem lol
            (;local.get $counter
            global.get $cellWH
            i32.rem_u
            ;; operand stack now has x
            local.get $counter
            global.get $cellWH
            i32.div_u
            ;; operand stack now has y

            call $getNeighbors;)

            ;;local.get $counter
            ;;i32.load8_u (memory $prevStates)
            ;;local.set $ourPrevState

            ;;we could've written the call to $getNeighbors like this (probably?)
            ;;call $getNeighbors (i32.rem (local.get $counter) (global.get $cellWH)) (i32.div (local.get $counter) (global.get $cellWH))
            ;; ok bruh apparently fucking not.
            ;; ok wait i was washed i used the wrong instructions, the rem and div instructions need to know if they're signed or not
            (call $getNeighbors
                (i32.rem_u
                    (local.get $counter)
                    (global.get $cellWH)
                )
                (i32.div_u
                    (local.get $counter)
                    (global.get $cellWH)
                )
            )

            ;; local.tee $neighbors
            local.set $neighbors

            ;; i could actually use arrays and index into them to figure out if we have enough neighbors for that XTRA ESPEED
            ;; actually better yet i could use one single array and multiply the length by our state (neighbors * state*8) (8 because there can only be 8 neighbors)
            ;; lowkey man this array solution might be easier to implement than just doing if statements... (wait that wasn't so hard ;)

            ;; damn we need to get our state again (which would lowkey be the third time...)

            local.get $counter
            i32.load8_u (memory $prevStates)
            (;i32.load8_u
                (memory $prevStates)
                (local.get $counter)
            ;)
            i32.const 1
            i32.eq
            (if (result i32)
                ;;bruh inside a block you can't access the outer operand stack (so we'll HAVE to re load $neighbors)
                (then                   ;; if we're alive
                    local.get $neighbors
                    i32.const 2
                    i32.eq
                    local.get $neighbors
                    i32.const 3
                    i32.eq
                    i32.add
                )
                (else                   ;; if we're dead
                    local.get $neighbors
                    i32.const 3
                    i32.eq
                )
            )

            local.set $tempAliveOrNotFuck

            ;;call $log
            ;; local.get $counter ;; we load this before the if statement such that i32.store8 has the parameters in the right order or some shit idk
            ;; nevermind this is getting weird we'll have to make a temp local variable FUCK
            local.get $counter
            local.get $tempAliveOrNotFuck
            i32.store8 (memory $states)
            ;; drop

            local.get $counter
            i32.const 1
            i32.add
            local.tee $counter          ;; incrementing counter, setting it, and pushing it back onto the operand stack
            ;; local.get $cellWH
            global.get $cellWH2
            i32.ne
            br_if $loop                 ;; jump if $counter != $cellWidth*$cellHeight (precalculated as $cellWh)
        )
    )
)
