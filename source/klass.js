/**
 * @auther Chang Long <changlon@gmail.com>
 * https://github.com/changloong/mooforce
 */

var Klass	= (function(){
	
	var _fn	= (function(){
		var fn	= {} ;

        fn.proxy = function(fn, obj) {
            return function() {
                return fn.apply(obj, arguments);
            };
        };

        fn.parent = function( _self, _parent ) {
            return function(){
                    var current = this.$super ;
                    this.$super = _parent ;
                    var result  = _self.apply(this, arguments);
                    this.$super = current ;
                    return result ;
                };
        };

		return fn ;
	})();

    var _string = (function() {
        
        var string = {} ;

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
		var array	= {} ;

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

        var object	= {} ;

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
 
         var Type = (function(){
            var types = [] ;
 
            var Events = function() {
                var events = {} ;
                return {
                    addEvent: function(type, fn) {
                        if (!(fn instanceof Function)) {
                            throw new Exception('add event need Function argument!');
                        }
                        type = _string.removeOn(type) ;
                        events[type] = _array.include( events[type] || [], fn);
                        return this;
                    },
                    fireEvent: fireEvent = function(type) {
                        type = _string.removeOn(type) ;
                        if ( events.hasOwnProperty(type) ) {
                            var _events = events[type];
                            for ( var i = 0; i < _events.length; i++) {
                                if( false === _events[i].apply(this, Array.prototype.slice.call(arguments, 1)) ) {
                                    return false ;
                                }
                            }
                        }
                        return true ;
                    } ,
                    removeEvent: function(type, fn) {
                        type = _string.removeOn(type);
                        if ( events.hasOwnProperty(type) ) {
                            _array.erase( events[type], fn) ;
                        }
                        return this;
                    }, 
                    addEvents: function(events) {
                        for ( var type in events)
                            if (events.hasOwnProperty(type)) {
                                this.addEvent(type, events[type]);
                            }
                        return this;
                    },
                    removeEvents : function(type) {
                        if (!(type instanceof String) ) {
                            for (_type in type)
                                if ( type.hasOwnProperty(_type)) {
                                    this.removeEvent( _type, type[_type] ) ;
                                }
                            return this;
                        }
                        type = _string.removeOn(type);
                        if ( events.hasOwnProperty(type) ) {
                            delete events[type] ;
                        }
                        return this;
                    }
                };
            };
            var Type = function (constructor, properties ){
                
                if ( properties.hasOwnProperty('extends') ) {
                    this.parent = arguments.callee.find( properties['extends'] ) ;
                    if( !this.parent ) {
                        throw new Error('extends is invalid');
                    }
                    delete properties['extends'] ;
                } else {
                    this.parent = null ;
                }

                this.constructor    = constructor ;
                types.push( this ) ;

                if ( properties.hasOwnProperty('initialize') ) {
                    if( 'function' !== typeof  properties['initialize'] ) {
                        throw new Error('initialize method is not function') ;
                    }
                    if( this.parent && this.parent.initialize ) {
                        this.initialize = _fn.parent(properties['initialize'], this.parent.initialize) ;
                    } else {
                        this.initialize = properties['initialize'] ;
                    }
                    delete properties['initialize'] ;
                } else {
                    this.initialize = this.parent ? this.parent.initialize : null ;
                }

                this.binds   = {} ;
                this.options = this.parent ? _object.clone(this.parent.options) : {} ;
                this.implements = [ Events ] ;

                this.extends( properties ) ;
            };

            Type.find = function(constructor){
                    var len = types.length ;
                    for ( var i = 0; i < len ; i++) {
                        if( types[i].constructor === constructor ) {
                            return types[i] ;
                        }
                    }
                    return null ;
                } ;

            Type.prototype.bind   = function( object, self ) {
                if( this.parent ) {
                    this.parent.bind( object ) ;
                }

                _object.each( this.binds, function( fn, name ) {
                    var parent = null ;
                    if( object.hasOwnProperty(name) ) {
                        var parent  = object[ name ] ;
                    } else if( self && this.constructor.prototype.hasOwnProperty(name) ) {
                        var parent  = this.constructor.prototype[ name ] ;
                        if( typeof parent !== 'function' ) {
                            parent = null ;
                        }
                    }
                    if( parent ) {
                        object[name]    = _fn.proxy( _fn.parent( fn, parent ) , object );
                    } else {
                        object[name]    = _fn.proxy(fn, object ) ;
                    }
                }, this ) ;
            };


            Type.prototype.extends   = function( properties ) {

                if( typeof properties !== 'object' ) {
                    throw new Error('implements properties must be object');
                }

                if ( properties.hasOwnProperty('Binds') ) {
                    if( ! properties['Binds'] initialize Array ) {
                        throw new Error('Binds must be array');
                    }
                    _array.each( properties['Binds'], function(p) {
                        if ( properties.hasOwnProperty(p) ) {
                            var fn  = properties[p] ;
                            delete properties[p];
                            if( 'function' !== typeof fn ) {
                                throw new Error('Binds method "' + p + '" is not function');
                            }
                            this.binds[p] = fn ;
                        } else {
                            throw new Error('Binds method "' + p + '" not exists');
                        }
                    }, type ) ;
                    delete properties['Binds'];
                }

                if ( properties.hasOwnProperty('options') ) {
                    this.options = _object.merge( _object.clone(properties['options'] ) , this.options) ;
                    delete properties['options'] ;
                }

                if ( properties.hasOwnProperty('implements') ) {
                    if( properties['implements'] instanceof Array ) {
                        _array.each(properties['implements'], function(value) {
                            this.push(value) ;
                        }, this.implements) ;
                    } else {
                        this.implements.push( properties['implements'] ) ;
                    }
                    delete properties['implements'] ;
                }

                if(  this.parent ) {
                    _object.each(properties, function(value, name){
                        if( value initialize Function && this.hasOwnProperty(name) && this[name] instanceof Function ) {
                            properties[name]  =  _fn.parent(value, this[name] ) ;
                        } else {
                            properties[name]  =  _object.clone(value);
                        } 
                    }, this.parent.constructor.prototype ) ;
                }

                this.constructor.prototype  = _object.merge( _object.clone(properties) ,  this.parent ? this.parent.constructor.prototype ? {} ) ;

            }

            return Type ;
        })() ;


        function initialize(type, object, args ){
            type.bind(object, true ) ;

            var options_initialize = true ;

            object.setOptions = function(options) {
                if (typeof options != 'object') {
                    throw new Error('options is not object') ;
                }
                var scope_initialize = null ;
                if ( options.hasOwnProperty('initialize') ) {
                    if( typeof options['initialize'] !== 'function' ) {
                        throw new Error('options.initialize is not function');
                    }
                    if ( options_initialize ) {
                        options_initialize  = options['initialize'] ;
                    } else {
                        scope_initialize    = options['initialize'] ;
                    }
                    delete options['initialize'];
                }

                this.options = _object.merge( _object.clone(options), this.options ) ;

                _object.each(this.options, function(value, key ) {
                    if ( key == 'events') {
                        this.addEvents(value) ;
                        delete this.options[key] ;
                    } else {
                        var type = _string.tryRemoveOn(key);
                        if ( key != type && typeof value === 'function' ) {
                            this.addEvent(type, value ) ;
                            delete this.options[key] ;
                        }
                    }
                }, this ) ;

                if ( scope_initialize ) {
                    scope_initialize.call(this) ;
                }
                return this;
            };

            object.options  = _object.clone(type.options) ;

            _array.each(type.implements, function( properties ){
                if( properties instanceof Function ) {
                    properties = properties.call( this ) ;
                }
                if( typeof properties !== 'object' ) {
                    throw new Error('implements "' + String( properties ) + '" is not object' );
                }

                if ( properties.hasOwnProperty('Binds') ) {
                    if( ! properties['Binds'] initialize Array ) {
                        throw new Error('Binds must be array');
                    }
                    _array.each( properties['Binds'], function(p) {
                        if ( properties.hasOwnProperty(p) ) {
                            var fn  = properties[p] ;
                            delete properties[p];
                            if( 'function' !== typeof fn ) {
                                throw new Error('Binds method "' + p + '" is not function');
                            }
                            this[p] = _fn.proxy( fn, this ) ;
                        } else {
                            throw new Error('Binds method "' + p + '" not exists');
                        }
                    }, type ) ;
                    delete properties['Binds'];
                }
                _object.merge(this, properties );
            }, object ) ;

            var return_value   = type.initialize ? type.initialize.apply(object, args) : object ;

            (function(){
                var fn    = options_initialize ;
                options_initialize = null ;
                if( true !== fn ) fn.call(this) ;
            }).call(object);

            return return_value ;
        }

        var Klass  = function ( properties ) {
            var type    = new Type(constructor, properties) ;
            function constructor() {
                return initialize(type, this, arguments ) ;
            } ;
            return constructor ;
        } ;

        Klass.implements    = function(constructor, properties ) {
            var type    = Type.find( constructor ) ;
            if( !type ) {
                throw new Error('implements klass is invalid');
            }
            type.implements.push( properties ) ; 
        };

        return Klass ;
    })();

})();
