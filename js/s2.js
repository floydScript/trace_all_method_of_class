// frida -U -f com.google.android.youtube -l ../js/s1.js
console.log("Script loaded successfully ");

Java.perform(function x() {
    console.log("Inside java perform function");
    //定位类
    var cls = Java.use("com.android.server.wm.ActivityClientController");
    var mhd_array = cls.class.getDeclaredMethods();

    console.log("Java.Use.Successfully! "+ cls);//定位类成功！

    //hook 类所有方法 （所有重载方法也要hook)
    for (var i = 0; i < mhd_array.length; i++) 
    {
        var mhd_cur = mhd_array[i]; //当前方法
        var str_mhd_name = mhd_cur.getName(); //当前方法名
        //console.log(str_mhd_name);

        //当前方法重载方法的个数
        var n_overload_cnt = cls[str_mhd_name].overloads.length;
        //console.log(n_overload_cnt);

        for (var index = 0; index < n_overload_cnt; index++) 
        {
            cls[str_mhd_name].overloads[index].implementation = function () 
            {
                //参数个数
                var n_arg_cnt = arguments.length;

                var args_str = "";

                for (var idx_arg = 0; idx_arg < n_arg_cnt; n_arg_cnt++) 
                {
                    // console.log(arguments[idx_arg]);   
                    args_str += arguments[idx_arg];
                }
                // console.log(str_mhd_name + '--' + n_arg_cnt + " args:" + args_str);
                return this[str_mhd_name].apply(this, arguments);
            }   
        }
    }

    // cls["finishActivity"].overload("IBinder", "int", "Intent", "int").implementation = function(token, resultCode, resultData, finishTask){
    //     //打印替换前的参数
    //     console.log( "original call: finishActivity");
    //     //把参数替换成2和5，依旧调用原函数   
    //     return this.finishActivity(token, resultCode, resultData, finishTask);
    // }
});