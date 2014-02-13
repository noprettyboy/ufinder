(function(){

    var debug = true;

    // just to bind context
    Function.prototype.bind = Function.prototype.bind || function(thisObj) {
        var args = Array.prototype.slice.call(arguments, 1);
        return this.apply(thisObj, args);
    };

    // 方便调试查看
    if ( debug ) {
        var origin = Object.prototype.toString;
        Object.prototype.toString = function () {
            return this.__KityClassName || origin.call( this );
        };
    }

    // 所有类的基类
    function Class() {}
    Class.__KityClassName = 'Class';

    function getCallerClass( instance, caller ) {
        var currentClass = instance.constructor;
    }

    // 提供 base 调用支持
    Class.prototype.base = function ( name ) {
        var caller = arguments.callee.caller;
        var method = caller.__KityMethodClass.__KityBaseClass.prototype[ name ];
        return method.apply( this, Array.prototype.slice.call( arguments, 1 ) );
    };

    // 直接调用 base 类的同名方法
    Class.prototype.callBase = function () {
        var caller = arguments.callee.caller;
        var method = caller.__KityMethodClass.__KityBaseClass.prototype[ caller.__KityMethodName ];
        return method.apply( this, arguments );
    };

    Class.prototype.mixin = function ( name ) {
        var caller = arguments.callee.caller;
        var mixins = caller.__KityMethodClass.__KityMixins;
        if(!mixins) {
            return this;
        }
        var method = mixins[ name ];
        return method.apply( this, Array.prototype.slice.call( arguments, 1 ) );
    };

    Class.prototype.callMixin = function () {
        var caller = arguments.callee.caller;
        var methodName = caller.__KityMethodName;
        var mixins = caller.__KityMethodClass.__KityMixins;
        if(!mixins) {
            return this;
        }
        var method = mixins[ methodName ];
        if ( methodName == 'constructor' ) {
            for ( var i = 0, l = method.length; i < l; i++ ) {
                method[ i ].call( this );
            }
            return this;
        } else {
            return method.apply( this, arguments );
        }
    };

    Class.prototype.pipe = function(fn) {
        if(typeof(fn) =='function') {
            fn.call(this, this);
        }
        return this;
    };

    Class.prototype.getType = function() {
        return this.__KityClassName;
    };

    // 检查基类是否调用了父类的构造函数
    // 该检查是弱检查，假如调用的代码被注释了，同样能检查成功（这个特性可用于知道建议调用，但是出于某些原因不想调用的情况）
    function checkBaseConstructorCall( targetClass, classname ) {
        var code = targetClass.toString();
        if ( !/this\.callBase/.test( code ) ) {
            throw new Error( classname + ' : 类构造函数没有调用父类的构造函数！为了安全，请调用父类的构造函数' );
        }
    }

    function checkMixinConstructorCall( targetClass, classname ) {
        var code = targetClass.toString();
        if ( !/this\.callMixin/.test( code ) ) {
            throw new Error( classname + ' : 类构造函数没有调用父类的构造函数！为了安全，请调用父类的构造函数' );
        }
    }

    var KITY_INHERIT_FLAG = '__KITY_INHERIT_FLAG_' + (+new Date());

    function inherit( constructor, BaseClass ) {

        var KityClass = function( __inherit__flag ) {
            if( __inherit__flag != KITY_INHERIT_FLAG ) {
                KityClass.__KityConstructor.apply(this, arguments);
            }
            this.__KityClassName = KityClass.__KityClassName;
        };
        KityClass.__KityConstructor = constructor;

        KityClass.prototype = new BaseClass(KITY_INHERIT_FLAG);

        for(var methodName in BaseClass.prototype) {
            if(BaseClass.prototype.hasOwnProperty(methodName) && methodName.indexOf('__Kity') !== 0) {
                KityClass.prototype[methodName] = BaseClass.prototype[methodName];
            }
        }

        KityClass.prototype.constructor = KityClass;

        return KityClass;
    }

    function mixin( NewClass, mixins ) {
        if ( false === mixins instanceof Array ) {
            return NewClass;
        }

        var i, length = mixins.length, proto, method;

        NewClass.__KityMixins = {
            constructor: []
        };

        for ( i = 0; i < length; i++ ) {
            proto = mixins[i].prototype;

            for( method in proto ) {
                if( false === proto.hasOwnProperty(method) || method.indexOf('__Kity') === 0) {
                    continue;
                }
                if( method === 'constructor' ) {
                    // constructor 特殊处理
                    NewClass.__KityMixins.constructor.push( proto[method] );
                } else {
                    NewClass.prototype[method] = NewClass.__KityMixins[method] = proto[method];
                }
            }
        }

        return NewClass;
    }

    function extend( BaseClass, extension ) {
        if(extension.__KityClassName) {
            extension = extension.prototype;
        }
        for(var methodName in extension) {
            if(extension.hasOwnProperty(methodName) &&
                methodName.indexOf('__Kity') &&
                methodName != 'constructor') {
                var method = BaseClass.prototype[ methodName ] = extension[ methodName ];
                method.__KityMethodClass = BaseClass;
                method.__KityMethodName = methodName;
            }
        }
        return BaseClass;
    }

    UF.createClass = function ( classname, defines ) {
        var constructor, NewClass, BaseClass;

        if(arguments.length === 1) {
            defines = arguments[0];
            classname = 'AnonymousClass';
        }

        BaseClass = defines.base || Class;

        if ( defines.hasOwnProperty( 'constructor' ) ) {
            constructor = defines.constructor;
            if ( BaseClass != Class ) {
                checkBaseConstructorCall( constructor, classname );
            }
        } else {
            constructor = function () {
                this.callBase.apply(this, arguments);
                this.callMixin.apply(this, arguments);
            };
        }

        NewClass = inherit( constructor, BaseClass );
        NewClass = mixin( NewClass, defines.mixins );

        NewClass.__KityClassName = constructor.__KityClassName = classname;
        NewClass.__KityBaseClass = constructor.__KityBaseClass = BaseClass;

        NewClass.__KityMethodName = constructor.__KityMethodName = 'constructor';
        NewClass.__KityMethodClass = constructor.__KityMethodClass = NewClass;

        // 下面这些不需要拷贝到原型链上
        delete defines.mixins;
        delete defines.constructor;
        delete defines.base;

        NewClass = extend( NewClass, defines );

        return NewClass;
    };

    UF.extendClass = extend;

})();