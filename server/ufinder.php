<?php

$ROOT = './files';

$cmd = $_GET['cmd'];
$target = $_GET['target'];

switch($cmd){
    case 'ls':
        if(isset($_GET['target'])) $target = $_GET['target'];
        else $target = '';
        $list = listFile($target, $ROOT);
        echo getJson('0', 'success', array('files' => $list));
        break;
    case 'rename':
        $name = $_GET['name'];
        $res = rename($ROOT.$target, $ROOT.$name);
        if($res) {
            echo getJson('0', 'success', array('file' => getFileInfo($name, $ROOT)));
        } else {
            echo getJson('1', 'error', array('file' => getFileInfo($target, $ROOT)));
        }
        break;
    case 'rm':
        $name = $_GET['name'];
        if(is_dir($ROOT.$target)) {
            $res = rmdir($ROOT.$target);
        } else {
            $res = unlink($ROOT.$target);
        }
        if($res) {
            echo getJson('0', 'success');
        } else {
            echo getJson('1', 'error', array('file' => getFileInfo($target, $ROOT)));
        }
        break;
    case 'touch':
//        sleep(3);
        if(!file_exists($ROOT.$target)) {
            $res = file_put_contents($ROOT.$target, '');
        } else {
            $res = true;
        }
        if($res) {
            echo getJson('0', 'success', array('file' => getFileInfo($target, $ROOT)));
        } else {
            echo getJson('1', 'error', array('file' => getFileInfo($target, $ROOT)));
        }
        break;
    case 'mkdir':
        $res = mkdir($ROOT.$target);
        if($res) {
            echo getJson('0', 'success', array('file' => getFileInfo($target, $ROOT)));
        } else {
            echo getJson('1', 'error', array('file' => getFileInfo($target, $ROOT)));
        }
        break;
    default:
        echo 'unknow action';
        break;
}

function listFile($dir, $ROOT){
    if ($handle = opendir($ROOT.$dir)){
        $output = array();
        $dir = $dir[strlen($dir) - 1] == '/' ? $dir:$dir.'/';
        while (false !== ($item = readdir($handle))){
            if ($item != "." && $item != ".."){
                $output[] = getFileInfo($dir.$item, $ROOT);
            }
        }
        closedir($handle);
        return $output;
    }else{
        return false;
    }
}

function getFileName($path){
    $index = strrpos($path, '/');
    if($index || $index === 0) {
        return substr($path, $index + 1);
    } else {
        return $path;
    }
}

function getFileInfo($path, $ROOT){
    $filepath = $ROOT.$path;
    $stat = stat($filepath);
    $info = array(
//        'hash' => substr(md5($filepath),8,16),
        'path' => $path,
        'name' => getFileName($path),
//        'isdir' => is_dir($filename),
        'type' => filetype($filepath),
        'read' => is_readable($filepath),
        'write' => is_writable($filepath),
        'time' => filemtime($filepath),
//        'dev' => $stat['dev'],
//        'ino' => $stat['ino'],
        'mode' => decoct($stat['mode']),
//        'nlink' => $stat['nlink'],
//        'uid' => $stat['uid'],
//        'gid' => $stat['gid'],
//        'rdev' => $stat['rdev'],
        'size' => $stat['size'],
//        'atime' => $stat['atime'],
//        'mtime' => $stat['mtime'],
//        'ctime' => $stat['ctime'],
//        'blksize' => $stat['blksize'],
//        'blocks' => $stat['blocks']
    );
    return $info;
}

function getJson($state, $message, $data = null){
    $output = array();
    $output['state'] = $state;
    $output['message'] = $message;
    if($data) $output['data'] = $data;
    return json_encode($output);
}

function array_sort($arr,$keys,$type='asc'){
    $keysvalue = $new_array = array();
    foreach ($arr as $k=>$v){
        $keysvalue[$k] = $v[$keys];
    }
    if($type == 'asc'){
        asort($keysvalue);
    }else{
        arsort($keysvalue);
    }
    reset($keysvalue);
    foreach ($keysvalue as $k=>$v){
        $new_array[$k] = $arr[$k];
    }
    return $new_array;
}


?>