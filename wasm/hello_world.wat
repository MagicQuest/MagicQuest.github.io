(module
    (global $hai (mut i32) i32.const 21)
	(func (export "main") (param i32) (result i32)
		global.get $hai
	)
)
