/**
 * @auther Chang Long <changlon@gmail.com>
 * https://github.com/changloong/mooforce
 */

var Klass	= (function(){
	
	var _fn	= (function(){
		var fn	= arguments.callee ;

		fn.proxy = function(fn, obj) {
			return function() {
				return fn.apply(obj, arguments);
			};
		};

		return fn ;
	})();

    var _string = (function() {
        var string = arguments.callee;
        string.removeOn = function(string) {
            return string.replace(/^on([A-Z])/, function(full, first) {
                return first.toLowerCase();
            });
        };
        string.tryRemoveOn = function(string) {
            if ( /^on([A-Z]\w+)$/.test(string) ) {
                return String(RegExp.$1).toLowerCase();
            } else {
                return string;
            }
        };
        return string;
    })();

	var _array = (function(){
		var array	= arguments.callee ;

        if ( Array.prototype.hasOwnProperty('indexOf') ) {
            array.include = function(array, item) {
                if (-1 == array.indexOf(item))
                    array.push(item);
                return array;
            };
            array.contains = function(array, item) {
                return -1 != array.indexOf(item);
            };
        } else {
            array.include = function(array, item) {
                for ( var i = array.length; i--;) {
                    if (array[i] == item)
                        return array;
                }
                array.push(item);
                return array;
            };
            array.contains = function(array, item) {
                for ( var i = array.length; i--;) {
                    if (array[i] == item)
                        return true;
                }
                return false;
            };
        }

        array.each	= function(array, fn, bind) {
            for ( var i = 0; i < array.length; i++) {
                fn.apply(bind || array, [ array[i], i ]);
            }
            ;
        } ;
        array.some	= function(array, fn, bind) {
            for ( var i = 0; i < array.length; i++) {
                if( fn.apply(bind || array, [ array[i], i ]) ) {
                    return true ;
                }
            }
            ;
        } ;
        array.every	= function(array, fn, bind) {
            for ( var i = 0; i < array.length; i++) {
                if( ! fn.apply(bind || array, [ array[i], i ]) ) {
                    return false ;
                }
            }
            return true ;
        } ;
		array.erase = function(array, item) {
				for ( var i = array.length; i--;) {
					if (array[i] === item)
						array.splice(i, 1);
				}
				return array;
			}; 
		return array ;
	})();
	
	var _object = (function(){

        var object	= arguments.callee ;
        object.is  = function(obj){
            if( obj instanceof Array ) {
                return false ;
            }
            if( obj instanceof Function ) {
                return false ;
            }
            return 'object' === typeof obj ;
        } ;

        object.merge = function(to, from) {
            if( object.is(to) ) {
                if( object.is(from) ) {
                    for(var k in from) if( from.hasOwnProperty(k) ) {
                        if( to.hasOwnProperty(k) ) {
                            to[k]   = arguments.callee( to[k], from[k] );
                        } else {
                            to[k]   = object.clone(from[k]) ;
                        }
                    }
                }
            }
            return to ;
        };
        object.each	= function(obj, fn, bind) {
			for ( var p in obj)
				if (obj.hasOwnProperty(p)) {
					fn.apply(bind || obj, [ obj[p], p ]);
				}
			return obj;
		};
        object.clone = function(obj) {
		            if( obj ) {
		                if (obj instanceof Array) {
		                        var len = obj.length;
		                        var _obj = new Array(len);
		                        for ( var i = 0; i < len; i++) {
		                                _obj[i] = arguments.callee(obj[i]);
		                        }
		                        return _obj;
		                } else if (typeof obj == 'object') {
		                        var _obj = new Object;
		                        for ( var i in obj)
		                                if ( obj.hasOwnProperty(i) ) {
		                                        _obj[i] = arguments.callee(obj[i]);
		                                }
		                        ;
		                        return _obj;
		                }
		            }
		            return obj;
			};
		return object ;
	})();

	return (function() {

        function Type(constructor, properties ){
            this.constructor    = constructor ;

            if ( properties.hasOwnProperty('extends') ) {
                this.parent = Type.find( properties['extends'] ) ;
                if( !this.parent ) {
                    throw new Error('extends is invalid');
                }
                delete properties['extends'] ;
            } else {
                this.parent = null ;
            }

            this.binds   = {} ;
            if ( properties.hasOwnProperty('Binds') ) {
                _array.each( properties['Binds'], function(p) {
                    if ( properties.hasOwnProperty(p) ) {
                        var fn  = properties[p] ;
                        delete properties[p];
                        if( 'function' !== typeof fn ) {
                            throw new Error('bind method "' + p + '" is not function');
                        }
                        this.binds[p] = fn ;
                    } else {
                        throw new Error('bind method "' + p + '" not exists');
                    }
                }, this ) ;
                delete properties['Binds'];
            }

            if ( properties.hasOwnProperty('options')) {
                this.options = _object.clone( properties['options'] ) ;
                delete properties['options'] ;
                if( this.parent ) this.options = _object.merge( this.options, this.parent.options ) ;
            } else {
                this.options = this.parent ? this.parent.options : {} ;
            }

            if ( properties.hasOwnProperty('initialize') ) {
                if( 'function' !== typeof  properties['initialize'] ) {
                    throw new Error('initialize method is not function') ;
                }
            } else {
                properties['initialize']    = function(){};
            }

            constructor.prototype   = {

            } ;

            for(var name in properties)  if( properties.hasOwnProperty(name) ) {
                constructor.prototype[name] = properties[name] ;
            }

            if( this.parent ) {
                _object.each( this.parent.constructor.prototype, function( property, name ){
                    if( !constructor.prototype.hasOwnProperty(name) ) {
                        constructor.prototype[name] = _object.clone(property) ;
                    } else {
                        var this_property   = constructor.prototype[name] ;
                        if( 'function' !== typeof(this_property) ) {
                            return ;
                        }
                        if( 'function' !== typeof(property) ) {
                            return ;
                        }
                        constructor.prototype[name] = function() {
                            var parent  = this.parent ;
                            this.parent  = property ;
                            var result = this_property.apply(this, arguments);
                            this.parent  = parent ;
                            return result ;
                        };
                    }
                }, this );
            }

            this.options_initialize = null ;
            Type.instances.push( this ) ;
        }

        Type.instances  = [] ;
        Type.find = function(constructor){
            var len = Type.instances.length ;
            for ( var i = 0; i < len ; i++) {
                if( Type.instances[i].constructor === constructor ) {
                    return Type.instances[i] ;
                }
            }
            return null ;
        } ;

        Type.prototype.bind   = function( object ) {
            if( this.parent ) {
                this.parent.bind( object ) ;
            }

            _object.each( this.binds, function( fn, name ) {
                if( object.hasOwnProperty(name) ) {
                    var fn_  = object[ name ] ;
                    object[name]    = function() {
                        var parent  = object.parent ;
                        object.parent  = fn_ ;
                        var result = fn.apply(object, arguments);
                        object.parent  = parent ;
                        return result ;
                    };
                } else {
                    object[name]    = _fn.proxy(fn, object ) ;
                }
            }, this );
        }

        function initialize(type, object, args ){
            type.bind(object) ;

            var $options_initialize = [] ;

            object.setOptions = function(options) {
                if (typeof options != 'object') {
                    throw new Error('options is not object') ;
                }
                var scope_initialize = null ;
                if ( options.hasOwnProperty('initialize') ) {
                    if( typeof options['initialize'] !== 'function' ) {
                        throw new Error('options.initialize is not function');
                    }
                    if ( $options_initialize ) {
                        $options_initialize.push( options['initialize'] ) ;
                    } else {
                        scope_initialize	= options['initialize'] ;
                    }
                    delete options['initialize'];
                }

                for ( var p in options) if ( options.hasOwnProperty(p) ) {
                    var _type = _string.tryRemoveOn(p);
                    if ( p != _type ) {
                        this.addEvent(_type, options[p]) ;
                        delete options[p] ;
                    } else if (p == 'events') {
                        this.addEvents(options[p]);
                        delete options[p] ;
                    }
                }

                _object.merge( this.options, options ) ;

                if ( scope_initialize ) {
                    scope_initialize.call(this) ;
                }
                return this;
            };
            var $events = {} ;
            object.addEvent = function(type, fn) {
                if (!(fn instanceof Function)) {
                    throw new Exception('add event need Function argument!');
                }
                type = _string.removeOn(type) ;
                $events[type] = _array.include($events[type] || [], fn);
                return this;
            };
            object.addEvents = function(events) {
                for ( var type in events)
                    if (events.hasOwnProperty(type)) {
                        this.addEvent(type, events[type]);
                    }
                return this;
            };
            object.removeEvent = function(type, fn) {
                type = _string.removeOn(type);
                if ( $events.hasOwnProperty(type) ) {
                    _array.erase($events[type], fn) ;
                }
                return this;
            };
            object.removeEvents = function(type) {
                if (!(type instanceof String) ) {
                    for (_type in type)
                        if ( type.hasOwnProperty(_type)) {
                            this.removeEvent( _type, type[_type] ) ;
                        }
                    return this;
                }
                type = _string.removeOn(type);
                if ( $events.hasOwnProperty(type)) {
                    delete $events[type] ;
                }
                return this;
            };
            object.fireEvent = function(type) {
                type = _string.removeOn(type) ;
                if ( $events.hasOwnProperty(type) ) {
                    var events = $events[type];
                    for ( var i = 0; i < events.length; i++) {
                        var fn = events[i];
                        if( false === fn.apply(this, Array.prototype.slice.call(arguments, 1)) ) {
                            return false ;
                        }
                    }
                }
                return true ;
            };

            object.options  = {} ;
            object.setOptions( type.options ) ;
            object.initialize.apply(object, args ) ;
            var _options_initialize    = $options_initialize ;
            $options_initialize = null ;
            _array.each( _options_initialize, function(initialize) {
                initialize.call(this) ;
            }, object ) ;
            _options_initialize = null ;
        }

        var Klass   = function ( properties ) {
            var type    = new Type(constructor, properties) ;
            function constructor() {
                initialize(type, this, arguments ) ;
            } ;
            return constructor ;
        }

        return Klass ;

    })();

})();
