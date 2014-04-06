/**
 * @auther Chang Long <changlon@gmail.com>
 * https://github.com/changloong/mooforce
 */

var Klass	= (function(){
	
    var Type   = (function() {
        var Type = function ( properties, prototype  ) {
            function type( self ) {
                this.self  = self ;
            }
            Type.implement(type, {
                is: function(self){
                    return self instanceof prototype ;
                }
            }) ;
            Type.implement(type, properties) ;
            return type ;
        };

        Type.implement    = function(type, properties ) {
            Type.each(properties, function(property, name ) {
                this[name]  = property ;
                if( !this.prototype.hasOwnProperty(name) ) {
                    this.prototype[name]    = function() {
                        return property.apply(this, Array.prototype.slice.call(arguments).unshift( this.self ) );
                    } ;
                }
            }, type );
        };

        Type.chain    = function(type, properties ) {
            Type.each(properties, function(property, name, type ) {
                this[name]  = property ;
                if( !type.prototype.hasOwnProperty(name) ) {
                    type.prototype[name]    = function() {
                        this.self = property.apply( this, Array.prototype.slice.call(arguments).unshift( this.self ) ) ;
                        return this.self ;
                    } ;
                }
            }, type ) ;
        };

        Type.each   = function(self, fn, bind ){
            for(var p in self ) if( self.hasOwnProperty(p) ) {
                fn.call( bind || self , self[p], p , bind || self ) ;
            }
        };
        
        return Type ;
    })();

	var $fn	= (function(){
        var enumerables = true;
        for (var i in {toString: 1}) enumerables = null;
        if (enumerables) enumerables = ['hasOwnProperty', 'valueOf', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'constructor'];

		var fn	= new Type({

        }, Function );

        Type.chain(fn, {
            proxy: function( self , obj) {
                return function() {
                    return self.apply(obj, arguments);
                };
            },
            parent: function( self, parent ) {
                return function(){
                        var current = this.parent ;
                        this.parent = parent ;
                        var result  = self.apply(this, arguments);
                        this.parent = current ;
                        return result ;
                    };
            }
        });

		return fn ;
	})();

	var $array = (function(){

		var array	= new Type({
            each: function(self, fn, bind) {
                for ( var i = 0; i < self.length; i++) {
                    fn.call(bind || self, self[i], i );
                }
            },
            erase: function(self, item) {
                for ( var i = self.length; i--;) {
                    if ( self[i] === item)
                        self.splice(i, 1);
                }
            }
        }, Array );

        if ( Array.prototype.hasOwnProperty('indexOf') ) {
            Type.chain(array, {
                include: function(self, item){
                    if (-1 == self.indexOf(item))
                        self.push(item);
                    return self ;
                }
            });
            Type.implement(array, {
                contains: function(self, item) {
                    return -1 != self.indexOf(item);
                }
            });
        } else {
            Type.chain(array, {
                include: function(self, item){
                    for ( var i = self.length; i--;) {
                        if (self[i] == item)
                            return self;
                    }
                    self.push(item);
                    return self;
                }
            });
            Type.implement({
                contains: function(self, item) {
                    for ( var i = self.length; i--;) {
                        if (self[i] == item)
                            return true;
                    }
                    return false;
                }
            });
        }

		return array ;
	})();
	
	var $object = (function() {
        var object	= new Type({
            is: function(self){
                if( self instanceof Array ) {
                    return false ;
                }
                return 'object' === typeof self ;
            },
            each: Type.each,
            merge: function( self, source ){
                if( object.is(self) && object.is( source ) ) {
                    for(var k in source ) if( source.hasOwnProperty(k) ) {
                        if( self.hasOwnProperty(k) ) {
                            arguments.callee( self[k], source[k] );
                        } else {
                            self[k]   = object.clone(source[k]) ;
                        }
                    }
                }
                return self ;
            },
            clone: function(self) {
                if (self instanceof Array) {
                    var len = self.length;
                    var o = new Array(len);
                    for ( var i = 0; i < len; i++) {
                        o[i] = arguments.callee(self[i]);
                    }
                    return o;
                } else if (  typeof self === 'object' ) {
                    var o = new Object ;
                    for ( var i in self)  if ( self.hasOwnProperty(i) ) {
                        o[i] = arguments.callee(self[i]);
                    }
                    return o ;
                }
                return self ;
            },
            reset: function(self){
                for (var key in self) {
                    var value = self[key] ;
                    if (value instanceof Array) {
                        var len = value.length;
                        var o = new Array(len) ;
                        for ( var i = 0; i < len; i++) {
                            o[i] = arguments.callee(value[i]);
                        }
                        self[key] = o ;
                    } else if ( typeof value == 'object' ) {
                        var F = function(){} ;
                        F.prototype = value ;
                        self[key] = arguments.callee(new F);
                    }
                }
                return self ;
            }
        }, Object ) ;

		return object ;
	})() ;

    var Class = (function() {
        var classes = [] ;

        function Class(constructor, properties ) {

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
            classes.push( this ) ;

            if ( properties.hasOwnProperty('initialize') ) {
                if( 'function' !== typeof  properties['initialize'] ) {
                    throw new Error('initialize method is not function') ;
                }
                if( this.parent && this.parent.initialize ) {
                    this.initialize = $fn.parent(properties['initialize'], this.parent.initialize) ;
                } else {
                    this.initialize = properties['initialize'] ;
                }
                delete properties['initialize'] ;
            } else {
                this.initialize = this.parent ? this.parent.initialize : null ;
            }

            this.binds   = {} ;
            this.implements = [ Class.Events, Class.Options ] ;
            this.constructor.prototype  = {} ;

            this.extends( properties ) ;
        };

        Class.find = function(constructor){
            var len = classes.length ;
            for ( var i = 0; i < len ; i++) {
                if( classes[i].constructor === constructor ) {
                    return classes[i] ;
                }
            }
            return null ;
        } ;

        Class.prototype.bind   = function( object, parent_prototype ) {
            if( this.parent ) {
                this.parent.bind( object ) ;
            }
            $object.each( this.binds, function( fn, name ) {
                var _fn = null ;
                if( object.hasOwnProperty(name) ) {
                    _fn = object[name] ;
                } else if( parent_prototype && parent_prototype.hasOwnProperty(name)  ) {
                    _fn = parent_prototype[ name ] ;
                }
                if( _fn && $fn.is( parent_prototype[name]) ) {
                    object[name]    = $fn.proxy( $fn.parent( fn, _fn ), object );
                } else {
                    object[name]    = $fn.proxy( fn, object ) ;
                }
            }, this ) ;
        };

        Class.prototype.extends   = function( properties ) {

            if( typeof properties !== 'object' ) {
                throw new Error('implements properties must be object');
            }

            if ( properties.hasOwnProperty('Binds') ) {
                if( ! $array.is(properties['Binds']) ) {
                    throw new Error('Binds must be array');
                }
                $array.each( properties['Binds'], function(p) {
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

            if ( properties.hasOwnProperty('implements') ) {
                if( properties['implements'] instanceof Array ) {
                    $array.each(properties['implements'], function(value) {
                        this.push(value) ;
                    }, this.implements) ;
                } else {
                    this.implements.push( properties['implements'] ) ;
                }
                delete properties['implements'] ;
            }

            if(  this.parent ) {
                $object.each(properties, function(value, name){
                    if( $fn.is(value) && this.hasOwnProperty(name) && $fn.is(this[name]) ) {
                        properties[name]  =  $fn.parent(value, this[name] ) ;
                    } else {
                        properties[name]  = $object.clone(value);
                    }
                }, this.parent.constructor.prototype ) ;
            }

            this.constructor.prototype  = $object.merge( properties ,  this.parent ? this.parent.constructor.prototype : {} ) ;

        };


        Class.prototype.construct  = function (object, args ){
            $object.reset(object) ;

            this.bind(object, this.parent ? this.parent.constructor.prototype : null ) ;

            var initialized = [] ;
            $array.each(this.implements, function( properties ){
                if( properties instanceof Function ) {
                    properties = properties.call( object, this.constructor ) ;
                } else {
                    if( typeof properties !== 'object' ) {
                        throw new Error('implements "' + String( properties ) + '" is not object' );
                    }
                    properties  = $object.clone( properties ) ;
                }

                if ( properties.hasOwnProperty('initialized') ) {
                    initialized.push( properties['initialized'] );
                    delete properties['initialized'] ;
                }

                if ( properties.hasOwnProperty('Binds') ) {
                    if( ! $array.is(properties['Binds']) ) {
                        throw new Error('Binds must be array');
                    }
                    $array.each( properties['Binds'], function(p) {
                        if ( properties.hasOwnProperty(p) ) {
                            var fn  = properties[p] ;
                            delete properties[p];
                            if( $fn.is(fn) ) {
                                this[p] = _fn.proxy( fn, this ) ;
                            } else {
                                throw new Error('Binds method "' + p + '" is not function');
                            }
                        } else {
                            throw new Error('Binds method "' + p + '" not exists');
                        }
                    }, object ) ;
                    delete properties['Binds'];
                }
                $object.merge(object, properties ) ;
            }, this ) ;

            var self = this.initialize ? this.initialize.apply(object, args) : object ;

            $array.each(initialized, function(fn){
                fn.call(this) ;
            }, object ) ;

            initialized = null ;

            return self ;
        };


        return Class ;
    })() ;

    Class.Events  = function() {
        var events = {} ;
        return {
            addEvent: function(type, fn) {
                if (!(fn instanceof Function)) {
                    throw new Exception('add event need Function argument!');
                }
                events[type] = $array.include( events[type] || [], fn);
                return this;
            } ,
            fireEvent: fireEvent = function(type) {
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
                if ( events.hasOwnProperty(type) ) {
                    $array.erase( events[type], fn) ;
                }
                return this;
            } ,
            addEvents: function(events) {
                for ( var type in events)
                    if (events.hasOwnProperty(type)) {
                        this.addEvent(type, events[type]);
                    }
                return this;
            } ,
            removeEvents : function(type) {
                if (!(type instanceof String) ) {
                    for (_type in type)
                        if ( type.hasOwnProperty(_type)) {
                            this.removeEvent( _type, type[_type] ) ;
                        }
                    return this;
                }
                if ( events.hasOwnProperty(type) ) {
                    delete events[type] ;
                }
                return this;
            }
        };
    } ;

    Class.Options  = (function() {
        function $removeOn(string) {
            return string.replace(/^on([A-Z])/, function(full, first) {
                return first.toLowerCase();
            });
        };
        function $tryRemoveOn(string) {
            if ( /^on([A-Z]\w+)$/.test(string) ) {
                return String(RegExp.$1).toLowerCase();
            } else {
                return string;
            }
        } ;
        return function( constructor ) {
            var options_initialized = true ;
            if( constructor.prototype.hasOwnProperty('options') ) {
                this.options    = $object.clone( constructor.prototype.options ) ;
            } else {
                this.options    = {} ;
            }
            return {
                initialized: function() {
                    var fn  = options_initialized ;
                    options_initialized = null ;
                    if( $fn.is(fn) ) {
                        fn.call(this) ;
                    }
                } ,
                setOptions: function(options) {
                    if( options ) {
                        if ( typeof options != 'object') {
                            throw new Error('options is not object') ;
                        }
                        this.options = $object.merge( options , this.options ) ;
                    }

                    $object.each( this.options, function(value, key ) {
                        if ( key === 'events') {
                            this.addEvents(value) ;
                            delete this.options[key] ;
                        } else {
                            if ( $fn.is(value) ) {
                                var type = $tryRemoveOn(key) ;
                                if( key != type ) {
                                    this.addEvent(type, value ) ;
                                    delete this.options[key] ;
                                }
                            }
                        }
                    }, this ) ;

                    var scope_initialized = null ;

                    if ( this.options.hasOwnProperty('initialized') ) {
                        if( $fn.is( this.options['initialized']) ) {
                            if ( options_initialized ) {
                                options_initialized  = this.options['initialized'] ;
                            } else {
                                scope_initialized  = this.options['initialized'] ;
                            }
                            delete this.options['initialized'];
                        }
                    }

                    if ( scope_initialized ) {
                        scope_initialized.call(this) ;
                    }
                    return this ;
                }
            };
        }
    })();

    var exports  = function ( properties ) {
        var klass    = new Class(constructor, properties) ;
        function constructor() {
            return klass.construct(this, arguments ) ;
        } ;
        return constructor ;
    } ;

    exports.extends    = function(constructor, properties ) {
        var klass    = Class.find( constructor ) ;
        if( !klass ) {
            throw new Error('extends klass is invalid');
        }
        klass.extends( properties ) ;
    } ;

    exports.implements    = function(constructor, properties ) {
        var klass    = Class.find( constructor ) ;
        if( !klass ) {
            throw new Error('implements klass is invalid');
        }
        klass.implements.push( properties ) ;
    } ;

    return exports ;
})();
