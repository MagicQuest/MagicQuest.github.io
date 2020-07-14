from urllib.request import urlopen

link = "https://magicquest.github.io/selfupdating.py"

f = urlopen(link)
myfile = f.read()
#print(myfile)
with open('selfupdating.py','r+') as this:
    thisFile = this.read()
    #print(thisFile)
    if(thisFile != myfile):
        print('hey its not the same!!')
        print('updating!')
        with open('selfupdating.py','w+') as this:
            this.write(myfile.decode("utf-8"))
            this.close()
    else:
        print('hey no need to update!!!')
    this.close()
f.close()
#if this test works you shouldn't see this anymore
#burh burhubhrubhr
#if this gets deleted you are gay!!!!!