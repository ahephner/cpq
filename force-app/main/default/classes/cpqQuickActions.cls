public class cpqQuickActions {
    public ApexPages.StandardSetController ctl {get; set;}
    public cpqQuickActions( ApexPages.StandardSetController controller ) {
         this.ctl = controller;
  		  
    }
    public PageReference newOpp(){
        string url;
        try{
        	id userId = UserInfo.getUserId();
            Date cd = System.today();
             
       		List<Sales_Rep__c> rep = [select id from Sales_Rep__c where Salesforce_User__c =: userID limit 1];
            if(rep.size()>0){
                
                   Opportunity opp = new Opportunity(name='New Opp ',CloseDate=cd,RecordTypeId = '0121D000003qH6eQAE',
                                             		Sales_Rep__c = rep[0].Id, Stagename='Working(25%)'); 
                	insert opp;
                	url = opp.Id;
            }else{
                system.debug('no rep');
                Opportunity nonRep = new Opportunity(name='New Opp ',CloseDate=cd,RecordTypeId = '0121D000003qH6eQAE',
                                             	     Stagename='Working(25%)');
                insert nonRep; 
                url = nonRep.Id; 
            }

        }catch(Exception e){
            ApexPages.addMessages(e); 
            return null;
        }

       return new PageReference('/lightning/r/Opportunity/'+url+'/view'); 
    }
}